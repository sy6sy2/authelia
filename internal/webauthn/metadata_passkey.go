package webauthn

import (
	"bytes"
	"context"
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"sync"

	"github.com/go-jose/go-jose/v4/json"
	"github.com/valyala/fasthttp"

	"github.com/authelia/authelia/v4/internal/configuration/schema"
	"github.com/authelia/authelia/v4/internal/model"
	"github.com/authelia/authelia/v4/internal/storage"
)

// NewPasskeyMetaDataProvider generates a new PasskeyMetadataProvider given a *schema.Configuration and storage.CachedDataProvider.
func NewPasskeyMetaDataProvider(config *schema.Configuration, store storage.CachedDataProvider) (provider PasskeyMetadataProvider, err error) {
	if config.WebAuthn.Metadata.Enabled {
		p := &StoreCachedPasskeyMetadataProvider{
			store:   store,
			handler: &productionPasskeyMetadataRemoteProvider{},
			data:    map[string]*model.PasskeyDeveloperAAGUID{},
		}

		provider = p
	}

	return provider, nil
}

type PasskeyMetadataProvider interface {
	StartupCheck() (err error)
	GetEntry(ctx context.Context, aaguid string) (entry *model.PasskeyDeveloperAAGUID)
}

type StoreCachedPasskeyMetadataProvider struct {
	mu      sync.Mutex
	store   storage.CachedDataProvider
	handler PasskeyMetadataRemoteProvider

	data map[string]*model.PasskeyDeveloperAAGUID

	tag string
}

func (p *StoreCachedPasskeyMetadataProvider) StartupCheck() (err error) {
	p.mu.Lock()

	defer p.mu.Unlock()

	return p.init()
}

func (p *StoreCachedPasskeyMetadataProvider) GetEntry(ctx context.Context, aaguid string) (entry *model.PasskeyDeveloperAAGUID) {
	p.mu.Lock()

	defer p.mu.Unlock()

	var ok bool

	if entry, ok = p.data[aaguid]; ok {
		return entry
	}

	return nil
}

func (p *StoreCachedPasskeyMetadataProvider) init() (err error) {
	if p.store == nil {
		return fmt.Errorf("error initializing provider: storage is not configured")
	}

	var (
		tag  string
		data []byte
	)

	ctx := context.Background()

	_, _, _, _ = p.loadCache(ctx)

	if _, tag, data, err = p.loadCurrent(ctx, p.tag); err != nil {
		return fmt.Errorf("error initializing provider: %w", err)
	}

	if len(p.tag) <= 0 {
		return fmt.Errorf("error initializing provider: no passkey metadata was loaded")
	}

	if data == nil {
		return nil
	}

	return p.saveCache(ctx, tag, data)
}

func (p *StoreCachedPasskeyMetadataProvider) load(ctx context.Context) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	return p.loadCurrent(ctx, p.tag)
}

func (p *StoreCachedPasskeyMetadataProvider) loadForced(ctx context.Context) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	return p.loadCurrent(ctx, "")
}

func (p *StoreCachedPasskeyMetadataProvider) loadCurrent(ctx context.Context, tagCurrent string) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	if metadata, tag, data, err = p.get(ctx, tagCurrent); err != nil {
		return nil, "", nil, err
	}

	if err = p.configure(metadata, tag); err != nil {
		return nil, "", nil, err
	}

	return metadata, "", data, nil
}

func (p *StoreCachedPasskeyMetadataProvider) get(ctx context.Context, tagCurrent string) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	if tag, data, err = p.latest(ctx, tagCurrent); err != nil {
		return nil, "", nil, fmt.Errorf("error loading latest metadata: %w", err)
	}

	if data == nil {
		return nil, "", nil, nil
	}

	if metadata, err = p.parse(bytes.NewReader(data)); err != nil {
		return nil, "", nil, fmt.Errorf("error parsing metadata: %w", err)
	}

	return metadata, tag, data, nil
}

func (p *StoreCachedPasskeyMetadataProvider) LoadCache(ctx context.Context) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	p.mu.Lock()

	defer p.mu.Unlock()

	return p.loadCache(ctx)
}

func (p *StoreCachedPasskeyMetadataProvider) loadCache(ctx context.Context) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	if metadata, tag, data, err = p.getCache(ctx); err != nil {
		return nil, "", nil, err
	}

	if metadata == nil {
		return nil, "", nil, nil
	}

	if err = p.configure(metadata, tag); err != nil {
		return nil, "", nil, err
	}

	return metadata, tag, data, nil
}

func (p *StoreCachedPasskeyMetadataProvider) getCache(ctx context.Context) (metadata map[string]*model.PasskeyDeveloperAAGUID, tag string, data []byte, err error) {
	var cache *model.CachedData

	if cache, err = p.store.LoadCachedData(ctx, cachePasskey); err != nil {
		return nil, "", nil, fmt.Errorf("error loading passkey metadata cache from database: %w", err)
	}

	if cache == nil || cache.Value == nil {
		return nil, "", nil, nil
	}

	if metadata, err = p.parse(bytes.NewReader(cache.Value)); err != nil {
		return nil, "", nil, fmt.Errorf("error parsing passkey metadata cache from database: %w", err)
	}

	return metadata, cache.Tag.String, cache.Value, nil
}

func (p *StoreCachedPasskeyMetadataProvider) saveCache(ctx context.Context, tag string, data []byte) (err error) {
	if len(data) == 0 {
		return fmt.Errorf("error saving passkey metadata cache to database: data is empty")
	}

	cache := model.CachedData{Name: cachePasskey, Tag: sql.NullString{Valid: true, String: tag}, Value: data}

	if err = p.store.SaveCachedData(ctx, cache); err != nil {
		return fmt.Errorf("error saving passkey metadata cache to database: %w", err)
	}

	return nil
}

func (p *StoreCachedPasskeyMetadataProvider) configure(metadata map[string]*model.PasskeyDeveloperAAGUID, tag string) (err error) {
	p.data = metadata
	p.tag = tag

	return nil
}

func (p *StoreCachedPasskeyMetadataProvider) latest(ctx context.Context, tagCurrent string) (tag string, data []byte, err error) {
	if p.handler == nil {
		p.handler = &productionPasskeyMetadataRemoteProvider{}
	}

	return p.handler.Fetch(ctx, tagCurrent)
}

func (p *StoreCachedPasskeyMetadataProvider) parse(reader io.Reader) (metadata map[string]*model.PasskeyDeveloperAAGUID, err error) {
	decoder := json.NewDecoder(reader)

	metadata = map[string]*model.PasskeyDeveloperAAGUID{}

	if err = decoder.Decode(&metadata); err != nil {
		return nil, fmt.Errorf("error parsing passkey metadata: %w", err)
	}

	return metadata, nil
}

type PasskeyMetadataRemoteProvider interface {
	Fetch(ctx context.Context, tagCurrent string) (tag string, data []byte, err error)
}

type productionPasskeyMetadataRemoteProvider struct {
	client *http.Client
}

func (h *productionPasskeyMetadataRemoteProvider) Fetch(ctx context.Context, tagCurrent string) (tag string, data []byte, err error) {
	if h.client == nil {
		h.client = &http.Client{}
	}

	var (
		req  *http.Request
		resp *http.Response
	)

	if req, err = http.NewRequestWithContext(ctx, http.MethodGet, "https://passkeydeveloper.github.io/passkey-authenticator-aaguids/combined_aaguid.json", nil); err != nil {
		return "", nil, fmt.Errorf("error creating request while attempting to get latest passkey metadata from passkey metadata service: %w", err)
	}

	if len(tag) > 0 {
		req.Header.Set(fasthttp.HeaderIfNoneMatch, tag)
	}

	if resp, err = h.client.Do(req); err != nil {
		return "", nil, fmt.Errorf("error getting latest passkey metadata from passkey metadata service: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return tagCurrent, nil, nil
	}

	data, err = io.ReadAll(resp.Body)

	tag = resp.Header.Get(fasthttp.HeaderETag)

	return tag, data, nil
}
