require_relative "boot"

require "rails/all"
require "net/http"
require "reading/csv/parse"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Plainreading
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.

    # TODO autoload or eager load reading/csv. this line doesn't work, nor does
    # autoload_paths, or putting /lib into the /app folder.
    # config.eager_load_paths += %W(#{config.root}/lib)

    config.autoload_paths += %W(#{config.root}/lib)

    # from https://andycroll.com/ruby/compress-your-rails-html-responses-on-heroku/
    config.middleware.use Rack::Deflater
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
