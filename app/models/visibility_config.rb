class VisibilityConfig < ApplicationRecord
  belongs_to :user
  has_many  :hidden_genres,
            class_name: "Genre"#,
            #foreign_key: :genre_id
  has_many  :hidden_formats,
            class_name: "Format"#,
            #foreign_key: :format_id

  LEVELS = { public: 3,
            friends: 2,
            starred_friends: 1,
            private: 0 }

  attribute :minimum_rating            , default: 4
  attribute :formats_visible           , default: false
  attribute :group_experiences_visible , default: true
  attribute :planned_visible           , default: true
  attribute :public_notes_visible      , default: true
  attribute :private_notes_visible     , default: false

  serialize :hidden_genres, Array

  def hidden_genres_string
    hidden_genres.join(", ")
  end

  def hidden_genres_string=(new_value)
    self.hidden_genres = new_value.split(/,\s*/)
  end

  def name
    LEVELS.key(level)
  end
end
