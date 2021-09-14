class CreateJoinTableItemsGenres < ActiveRecord::Migration[6.1]
  def change
    create_join_table :items, :genres do |t|
      # t.index [:item_id, :genre_id]
      # t.index [:genre_id, :item_id]
    end
  end
end
