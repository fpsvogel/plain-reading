class Source < ApplicationRecord
  has_and_belongs_to_many :variants

  DEFAULT = Source.find_by(name: "unspecified") || new(name: "unspecified")
  # after_create :replace_default

  validates :name,
    presence: true,
    uniqueness: true

  validates :url,
    uniqueness: true,
    allow_nil: true

  # RM
  # def replace_default
  #   if variant.sources.first = DEFAULT
  #     variant.sources.delete_all
  #   end
  # end
end
