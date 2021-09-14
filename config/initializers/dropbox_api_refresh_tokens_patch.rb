# how to patch a gem: learned from https://stackoverflow.com/questions/17118657/monkey-patching-devise-or-any-rails-gem
# but I needed to completely replace ConnectionBuilder and Authenticator, so: https://stackoverflow.com/questions/30348581/how-to-undefine-namespaced-class-in-ruby


DropboxApi.send(:remove_const, :ConnectionBuilder)
DropboxApi.send(:remove_const, :Authenticator)

module DropboxApi
  class ConnectionBuilder
    def initialize(oauth_bearer)
      @oauth_bearer = oauth_bearer
    end

    def middleware
      @middleware ||= MiddleWare::Stack.new
    end

    def build(url)
      Faraday.new(url) do |connection|
        middleware.apply(connection) do
          connection.authorization :Bearer, @oauth_bearer.is_a?(DropboxApi::Token) ? @oauth_bearer.short_lived_token : @oauth_bearer
          yield connection
        end
      end
    end
  end

  class Authenticator < OAuth2::Client
    def initialize(client_id, client_secret)
      super(client_id, client_secret, {
        authorize_url: 'https://www.dropbox.com/oauth2/authorize',
        token_url: 'https://api.dropboxapi.com/oauth2/token'
      })
    end
  end

  class Token
    extend Forwardable
    def_delegators :@token, :token, :refresh_token, :expired

    def initialize(authenticator, token_hash = nil)
      @authenticator = authenticator
      load_token(token_hash) if token_hash
    end

    def self.from_code(authenticator, code, redirect_uri: nil)
      self.new(authenticator, authenticator.auth_code.get_token(code, redirect_uri: redirect_uri))
    end

    def load_token(token_hash)
      if token_hash.is_a?(OAuth2::AccessToken)
        @token = token_hash
      else
        @token = OAuth2::AccessToken.from_hash(@authenticator, token_hash)
      end
    end

    def refresh_token()
      @token = @token.refresh!
      save!
    end

    def save_token(token_hash); end

    def save!
      save_token(@token.to_hash)
    end

    def short_lived_token()
      refresh_token if @token.expired?
      @token.token
    end
  end
end
