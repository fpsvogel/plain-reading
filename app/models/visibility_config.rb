class VisibilityConfig < ApplicationRecord
  belongs_to :user
  has_many  :hidden_genres,
            class_name: "Genre"#,
            #foreign_key: :genre_id
  has_many  :hidden_formats,
            class_name: "Format"#,
            #foreign_key: :format_id

  # visibility levels
  PUBLIC = 3
  FRIENDS = 2
  STARRED = 1
  ME = 0

  attribute :minimum_rating       , default: 4
  attribute :formats_visible      , default: false
  attribute :group_reads_visible  , default: true
  attribute :planned_visible      , default: true
  attribute :public_notes_visible , default: true
  attribute :private_notes_visible, default: false
end
