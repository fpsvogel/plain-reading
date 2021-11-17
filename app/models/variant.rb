class Variant < ApplicationRecord
  belongs_to :item
  belongs_to :format, optional: true
  has_and_belongs_to_many :sources
  belongs_to :length,
              optional: true,
              polymorphic: true

  before_save :add_defaults
  # RM for the sake of speed I'm instead doing a batch check in List#load_items.
  # before_destroy :destroy_orphaned_sources

  private

  def add_defaults
    unless sources.any?
      sources << Source::DEFAULT
    end
    true
  end

  # def destroy_orphaned_sources
  #   sources.each do |source|
  #     source.destroy if source.variants.to_a == [self]
  #   end
  # end
end
