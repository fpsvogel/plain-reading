source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.0.2'

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 7.0.0.alpha2"

# Use postgresql as the database for Active Record
gem "pg", "~> 1.1"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 5.0"

# Use jsbundling [https://github.com/rails/jsbundling-rails]
gem 'jsbundling-rails'

# Hotwire's SPA-like page accelerator [https://turbo.hotwired.dev]
gem "turbo-rails", ">= 0.7.11"

# Hotwire's modest JavaScript framework [https://stimulus.hotwired.dev]
gem "stimulus-rails", ">= 0.4.0"

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder", "~> 2.7"

# Use Redis adapter to run Action Cable in production
# gem "redis", "~> 4.0"

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[ mingw mswin x64_mingw jruby ]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", ">= 1.4.4", require: false

# Use Active Model has_secure_password [https://guides.rubyonrails.org/active_model_basics.html#securepassword]
gem "bcrypt", "~> 3.1.7"

# Use Sass to process CSS
gem "sassc-rails", "~> 2.1"

# Use Active Storage variants [https://guides.rubyonrails.org/active_storage_overview.html#transforming-images]
# gem "image_processing", "~> 1.2"

group :development, :test do
  # Start debugger with binding.b [https://github.com/ruby/debug]
  gem "debug", ">= 1.0.0", platforms: %i[ mri mingw x64_mingw ]
end

group :development do
  # Access an interactive console on exception pages or by calling 'console' anywhere in the code.
  gem 'web-console', '>= 4.1.0'
  # Display performance information such as SQL time and flame graphs for each request in your browser.
  # Can be configured to work on production as well see: https://github.com/MiniProfiler/rack-mini-profiler/blob/master/README.md
  gem 'rack-mini-profiler', '~> 2.0'
  gem 'memory_profiler'
  gem 'stackprof'
end

group :test do
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '>= 3.26'
  gem 'selenium-webdriver'
  # Easy installation and use of web drivers to run system tests with browsers
  gem 'webdrivers'
  gem 'minitest-reporters'
end

# Authentication [https://github.com/Sorcery/sorcery]
gem "sorcery"

# Background jobs processing [https://github.com/mperham/sidekiq]
gem "sidekiq"

# Dropbox API [https://github.com/Jesus/dropbox_api/]
gem "dropbox_api", "0.1.19"

# CSV reading log parsing [https://github.com/fpsvogel/reading-csv]
gem "reading-csv"

# Autolinking [https://github.com/vmg/rinku]
gem "rinku"

# For Markdown views [https://github.com/ytbryan/emd]
gem 'redcarpet'
gem 'emd'
