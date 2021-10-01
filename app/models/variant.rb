class Variant < ApplicationRecord
  belongs_to :item
  belongs_to :format, optional: true
  has_and_belongs_to_many :sources
  belongs_to :length, optional: true, polymorphic: true
  # TODO: ideally the associations with :format and :length would be reversed.
  # has_one :format (and in Format, belongs_to_many :variants)
  #  -> but the belongs_to_many association doesn't exist.
  # has_one :length, polymorphic: true (and in Length, belongs_to :variants)
  #  -> but polymorphic can only be used on belongs_to, not on has_one

  before_create :add_defaults

  serialize :extra_info, Array

  private

  def add_defaults
    # sources << Source::DEFAULT unless sources.any?
    unless sources.any?
      sources << Source::DEFAULT
    end
    true
  end
end
