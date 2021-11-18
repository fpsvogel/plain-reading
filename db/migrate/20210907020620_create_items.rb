class CreateItems < ActiveRecord::Migration[7.0]
  def change
    create_table :items do |t|
      t.float :rating
      t.string :author
      t.string :title
      t.integer :visibility
      t.text :public_notes, array: true
      t.text :blurb
      t.text :private_notes, array: true
      t.text :history, array: true
      t.string :view_rating
      t.string :view_format_or_type
      t.string :view_url
      t.string :view_name
      t.string :view_date_finished
      t.boolean :planned
      t.string :group_experiences, array: true
      t.references :list, null: false, foreign_key: true

      t.timestamps
    end

    add_index :items, :rating
    add_index :items, :view_format_or_type
    add_index :items, :visibility
    add_index :items, :planned
    add_index :items, :view_date_finished
  end
end
