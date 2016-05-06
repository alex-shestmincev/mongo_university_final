/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function CartDAO(database) {
    "use strict";

    this.db = database;


    this.getCart = function(userId, callback) {
        "use strict";

        this.db.collection("cart").findOne({userId: userId})
          .then((userCart) => {
            callback(userCart);
          })
          .catch((err) => console.error(err))
    }


    this.itemInCart = function(userId, itemId, callback) {
        "use strict";

        this.db.collection("cart").aggregate([
          { $match: {userId: userId}},
          { $unwind: "$items"},
          { $match: {"items._id": itemId} },
        ]).toArray((err, docs) => {
          if (err) console.error(err);

          if (docs.length > 1) {
            console.error(`itemInCart should return one item, now ${docs.length} items`, docs.items);
          } else if (docs.length === 1) {
            callback(docs[0].items);
          } else {
            callback(null);
          }

        })
    }


    /*
     * This solution is provide as an example to you of several query
     * language features that are valuable in update operations.
     * This method adds the item document passed in the item parameter to the
     * user's cart. Note that this solution works regardless of whether the
     * cart already contains items or is empty. addItem will be called only
     * if the cart does not already contain the item. The route handler:
     * router.post("/user/:userId/cart/items/:itemId"...
     * handles this. Please review how that method works to have a complete
     * understanding of how addItem is used.
     *
     * NOTE: One may use either updateOne() or findOneAndUpdate() to
     * write this method. We did not discuss findOneAndUpdate() in class,
     * but it provides a very straightforward way of solving this problem.
     * See the following for documentation:
     * http://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html#findOneAndUpdate
     *
     */
    this.addItem = function(userId, item, callback) {
        "use strict";

        this.db.collection("cart").findOneAndUpdate(
            {userId: userId},
            {"$push": {items: item}},
            {
                upsert: true,
                returnOriginal: false
            },
            function(err, result) {
                assert.equal(null, err);
                callback(result.value);
            });
    };


    this.updateQuantity = function(userId, itemId, quantity, callback) {
        "use strict";

        if (!quantity) {
          this.db.collection("cart").findOneAndUpdate(
            {userId: userId},
            {$pull: {items: {_id: itemId}}},
            {
                upsert: true,
                returnOriginal: false
            },
            function(err, result) { console.log('result', result);
                assert.equal(null, err);
                callback(result.value);
            });
        } else {
          this.db.collection("cart").findOneAndUpdate(
              {userId: userId, 'items._id': itemId},
              { $set: { "items.$.quantity" : quantity } },
              {
                  upsert: true,
                  returnOriginal: false
              },
              function(err, result) { console.log('result', result.value);
                  assert.equal(null, err);
                  callback(result.value);
              });
        }
    }

    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            quantity: 1,
            reviews: []
        };

        return item;
    }

}


module.exports.CartDAO = CartDAO;
