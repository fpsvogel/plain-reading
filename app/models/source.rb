class Source < ApplicationRecord
  has_and_belongs_to_many :items

  DEFAULT = new(name: "unspecified")
  after_create :replace_default

  validates :name,
    presence: true,
    uniqueness: true

  validates :url,
    uniqueness: true

  def replace_default
    if parent.sources.first = DEFAULT
      parent.sources.delete_all
    end
  end
end
