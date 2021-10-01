require_relative "boot"

require "rails/all"
require "net/http"

require "reading/csv/parse"
# require "attr_extras"
# require "pastel"
# require "date"
# require "./lib/reading/csv/config"
# require "./lib/reading/csv/parse"
# # Dir["./lib/reading/*.rb"].each { |file| require file }
# # Dir["./lib/reading/csv/*.rb"].each { |file| require file }


# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Plainreading
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1

    # TODO autoload or eager load reading/csv. this line doesn't work, nor does
    # autoload_paths, or putting /lib into the /app folder.
    # config.eager_load_paths += %W(#{config.root}/lib)
    config.autoload_paths += %W(#{config.root}/lib)

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
