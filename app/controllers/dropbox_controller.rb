class DropboxController < ApplicationController
  def auth
    url = self.class.authenticator.auth_code.authorize_url(token_access_type: "offline", redirect_uri: redirect_uri) # authenticator.authorize_url :redirect_uri => redirect_uri
    redirect_to url
  end

  # Example call:
  # GET /dropbox/auth_callback?code=VofXAX8DO1sAAAAAAAACUKBwkDZyMg1zKT0f_FNONeA
  def auth_callback
    token = MyDropboxToken.from_code(self.class.authenticator, params[:code], redirect_uri: redirect_uri) # TODO leave a comment about redirect_uri in https://github.com/Jesus/dropbox_api/pull/83/files
    token.save!
    #auth_bearer = authenticator.get_token(params[:code],
    #                                      :redirect_uri => redirect_uri)
    #Current.user.create_dropbox_account(
    #  token: auth_bearer.token
    #)

    redirect_to settings_path, notice: "Successfully connected your Dropbox account."
  end

  def disconnect
    Current.user.dropbox_account.destroy
    redirect_to settings_path, notice: "Disconnected your Dropbox account."
  end

  def update_filepath
    if filepath_param[:filepath].match?(/\A\s*\z/)
      redirect_to settings_path, alert: "You must provide a file path to your reading list."
      return
    elsif !filepath_param[:filepath].downcase.match?(/\.csv\z/)
      redirect_to settings_path, alert: "The Dropbox file must be a CSV file."
      return
    end
    param_downcase_with_leading_slash =
      filepath_param.tap { |p| p[:filepath].downcase! }
                    .tap { |p| p[:filepath].sub!(/\A/, "/") }
                    .tap { |p| p[:filepath].sub!("//", "/") }
    Current.user.dropbox_account.update(param_downcase_with_leading_slash)
    redirect_to settings_path, notice: "Dropbox file path updated."
  end

  def self.authenticator
    DropboxApi::Authenticator.new(Rails.application.credentials.dig(:dropbox, :app_key), Rails.application.credentials.dig(:dropbox, :app_secret)) # TODO try @authenticator ||=
  end

  private

  def redirect_uri
    dropbox_auth_callback_url
  end

  def filepath_param
    params.require(:dropbox_account).permit(:filepath)
  end
end
