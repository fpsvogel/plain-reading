class CreateItems < ActiveRecord::Migration[6.1]
  def change
    create_table :items do |t|
      t.float :rating
      t.string :author
      t.string :title
      t.integer :visibility
      t.text :public_notes
      t.text :blurb
      t.text :private_notes
      t.text :history
      t.string :view_rating
      t.string :view_type
      t.string :view_url
      t.string :view_name
      t.string :view_date_finished
      t.boolean :planned
      t.string :group_experiences
      t.references :list, null: false, foreign_key: true

      t.timestamps
    end

    add_index :items, :rating
    add_index :items, :view_type
    add_index :items, :visibility
    add_index :items, :planned
    add_index :items, :view_date_finished
  end
end
