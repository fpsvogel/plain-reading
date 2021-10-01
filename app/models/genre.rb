class Genre < ApplicationRecord
  belongs_to :visibility_config, optional: true
  has_and_belongs_to_many :items

  DEFAULT = Genre.find_by(name: "uncategorized") || new(name: "uncategorized")
  # before_create :replace_default

  validates :name,
    presence: true,
    uniqueness: true

  # RM
  # def replace_default
  #   if item.genres.first = DEFAULT
  #     item.genres.delete_all
  #   end
  #   true
  # end

  def to_s
    name
  end
end
