class CreateItems < ActiveRecord::Migration[6.1]
  def change
    create_table :items do |t|
      t.float :rating
      t.string :author
      t.string :title
      t.string :series
      t.integer :volume
      t.text :extra_info
      t.string :isbn
      t.integer :length_pages
      t.time :length_time
      t.text :blurb
      t.text :history
      t.integer :visibility
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
