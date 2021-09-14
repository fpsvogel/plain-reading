class Item < ApplicationRecord
  belongs_to :user
  has_many :perusals
  has_and_belongs_to_many :sources
  has_and_belongs_to_many :genres
  has_many  :public_notes,
            class_name: "Note"#,
            #foreign_key: :note_id
  has_many  :private_notes,
            class_name: "Note"#,
            #foreign_key: :note_id

  before_create :add_defaults

  attribute :visibility, default: VisibilityConfig::PUBLIC
  serialize :extra_info, Array

  validates :title,
    presence: true

  def add_defaults
    genres << Genre.DEFAULT
    source << Source.DEFAULT
    true
  end

end
