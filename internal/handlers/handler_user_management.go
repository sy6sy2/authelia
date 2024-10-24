package handlers

import (
	"reflect"

	"github.com/authelia/authelia/v4/internal/authentication"
	"github.com/authelia/authelia/v4/internal/middlewares"
	"github.com/authelia/authelia/v4/internal/session"
	"github.com/valyala/fasthttp"
)

type changeUserRequestBody struct {
	Username    string   `json:"username"`
	DisplayName string   `json:"display_name"`
	Email       string   `json:"email"`
	Groups      []string `json:"groups"`
}

func ChangeUserPOST(ctx *middlewares.AutheliaCtx) {
	var (
		err         error
		requestBody changeUserRequestBody
		userDetails *authentication.UserDetails
		adminUser   session.UserSession
	)

	if adminUser, err = ctx.GetSession(); err != nil {
		ctx.Logger.Error("error retrieving admin session")
		return
	}

	if err = ctx.ParseBody(&requestBody); err != nil {
		ctx.Error(err, messageUnableToModifyUser)
		return
	}

	if len(requestBody.Username) == 0 {
		ctx.Logger.Debugf("username is blank, no users changed")
		return
	}

	if userDetails, err = ctx.Providers.UserProvider.GetDetails(requestBody.Username); err != nil {
		ctx.Logger.WithError(err).Error("Error retrieving details for user '%s': %s", requestBody.Username, err)
	}

	if userDetails.DisplayName != requestBody.DisplayName {
		if err = ctx.Providers.UserProvider.ChangeDisplayName(requestBody.Username, requestBody.DisplayName); err != nil {
			ctx.Logger.WithError(err).Errorf("Error changing display name to '%s' for user '%s'", requestBody.DisplayName, requestBody.Username)
			return
		}
		ctx.Logger.Debugf("User '%s' display name changed to '%s' by administrator: '%s'", requestBody.Username, requestBody.DisplayName, adminUser.Username)

	}
	if userDetails.Emails[0] != requestBody.Email {
		if err = ctx.Providers.UserProvider.ChangeEmail(requestBody.Username, requestBody.Email); err != nil {
			ctx.Logger.WithError(err).Error("Error changing email for user '%s'", requestBody.Username)
			return
		}
		ctx.Logger.Debugf("User '%s' email changed to '%s' by administrator: '%s'", requestBody.Username, requestBody.Email, adminUser.Username)
	}

	if !reflect.DeepEqual(userDetails.Groups, requestBody.Groups) {
		if err = ctx.Providers.UserProvider.ChangeGroups(requestBody.Username, requestBody.Groups); err != nil {
			ctx.Logger.WithError(err).Error("Error changing groups for user '%s'", requestBody.Username)
			return
		}
		ctx.Logger.Debugf("User '%s' groups changed to '%s' by administrator: '%s'", requestBody.Username, requestBody.Groups, adminUser.Username)
	}

	ctx.Response.SetStatusCode(fasthttp.StatusOK)
}
