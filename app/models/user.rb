class User < ApplicationRecord
  has_one :dropbox_account
  has_one :csv_config
  has_many :visibility_configs
  has_one :list

  authenticates_with_sorcery!

  before_create :build_default_visibility_configs
  before_create :build_default_csv_config
  before_create :build_empty_list

  validates :username,
    presence: true,
    uniqueness: true,
    length: { maximum: 50 },
    format: { with: /\A[a-z0-9\-\s]+\z/,
              message: "must include only lowercase letters, numbers, and hyphens" }

  validates :email,
    presence: true,
    uniqueness: true,
    length: { maximum: 255 },
    format: { with: /\A[^@\s]+@[^@\s]+\z/,
              message: "must be a valid email address" }

  def build_default_csv_config
    build_csv_config # all defaults are in the model CsvConfig.
  end

  def build_default_visibility_configs
    visibility_configs.build(
      level: VisibilityConfig::LEVELS[:public]
      # these defaults are in the model VisibilityConfig.
    )
    visibility_configs.build(
      level: VisibilityConfig::LEVELS[:friends],
      minimum_rating: 0
    )
    visibility_configs.build(
      level: VisibilityConfig::LEVELS[:starred_friends],
      minimum_rating: 0
    )
    true
  end

  def build_empty_list
    build_list
  end

  def dropbox_connected?
    !dropbox_account.nil?
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
