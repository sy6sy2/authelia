package handlers

import (
	"github.com/valyala/fasthttp"

	"github.com/authelia/authelia/v4/internal/middlewares"
	"github.com/authelia/authelia/v4/internal/model"
	"github.com/authelia/authelia/v4/internal/session"
)

func WebAuthnAAGUIDInfoPOST(ctx *middlewares.AutheliaCtx) {
	bodyJSON := bodyRequestWebAuthnAAGUID{}

	var (
		userSession session.UserSession
		err         error
	)

	if userSession, err = ctx.GetSession(); err != nil {
		ctx.Logger.WithError(err).Error("Error occurred retrieving user session")

		ctx.SetStatusCode(fasthttp.StatusForbidden)
		ctx.SetJSONError(messageOperationFailed)

		return
	}

	if err = ctx.ParseBody(&bodyJSON); err != nil {
		ctx.Logger.WithError(err).Errorf("Error occurred validating a WebAuthn AAGUID information request for user '%s': %s", userSession.Username, errStrReqBodyParse)

		ctx.SetStatusCode(fasthttp.StatusBadRequest)
		ctx.SetJSONError(messageOperationFailed)

		return
	}

	var entry *model.PasskeyDeveloperAAGUID

	if entry = ctx.Providers.PasskeyMetadata.GetEntry(ctx, bodyJSON.AAGUID); entry == nil {
		ctx.Logger.Debugf("Error occurred validating a WebAuthn AAGUID information request for user '%s': failed to lookup entry with AAGUID '%s'", userSession.Username, bodyJSON.AAGUID)

		ctx.SetStatusCode(fasthttp.StatusNotFound)
		ctx.SetJSONError("Not found.")

		return
	}

	if err = ctx.SetJSONBody(entry); err != nil {
		ctx.Logger.WithError(err).Errorf("Error occurred setting the response body for a WebAuthn AAGUID information request for user '%s' and AAGUID '%s'", userSession.Username, bodyJSON.AAGUID)
	}
}
