class Variant < ApplicationRecord
  belongs_to :item
  belongs_to :format, optional: true
  has_and_belongs_to_many :sources
  belongs_to :length,
              optional: true,
              polymorphic: true

  before_create :add_defaults

  private

  def add_defaults
    unless sources.any?
      sources << Source::DEFAULT
    end
    true
  end
end
