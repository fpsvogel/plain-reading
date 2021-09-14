class Genre < ApplicationRecord
  belongs_to :visibility_config
  has_and_belongs_to_many :items

  DEFAULT = new(name: "uncategorized")
  before_create :replace_default

  validates :name,
    presence: true,
    uniqueness: true

  def replace_default
    if parent.genres.first = DEFAULT
      parent.genres.delete_all
    end
    true
  end
end
