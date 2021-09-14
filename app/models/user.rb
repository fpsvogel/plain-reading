class User < ApplicationRecord
  has_one :dropbox_account
  has_one :csv_config
  has_many :visibility_configs
  has_many :items

  has_secure_password

  before_create :build_default_visibility_configs
  before_create :build_default_csv_config

  validates :email,
    presence: true,
    uniqueness: true,
    format: { with: /\A[^@\s]+@[^@\s]+\z/, message: "must be a valid email address" }

  def build_default_csv_config
    build_csv_config # all defaults are in the model CsvConfig.
  end

  def build_default_visibility_configs
    visibility_configs.build(
      level: VisibilityConfig::PUBLIC
      # these defaults are in the model VisibilityConfig.
    )
    visibility_configs.build(
      level: VisibilityConfig::FRIENDS,
      minimum_rating: 0
    )
    visibility_configs.build(
      level: VisibilityConfig::STARRED,
      minimum_rating: 0
    )
    true
  end

  def dropbox_connected?
    !dropbox_account.nil?
  end

  def sync_items(uploaded_file: nil)
    _file = uploaded_file || dropbox_account.reading_csv_file
    # the uploaded file is a Tmpfile
    # but the dropbox file is a string
    # so can I iterate over either with #each_line?
    binding.pry
    nil
  end

  def self.nuke
    DropboxAccount.destroy_all
    Format.destroy_all
    CsvConfig.destroy_all
    VisibilityConfig.destroy_all
    Item.destroy_all
    destroy_all
  end
end
