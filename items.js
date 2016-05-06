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


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

        var categories = [];
        var cursor = this.db.collection('item').aggregate([
          { $group: {_id: {category: "$category"}, count: {$sum: 1}}},
          { $project: {category: "$_id.category", count: "$count", _id: 0}},
          { $sort: {category: 1 }}
        ], { cursor: { batchSize: 1 } });

        // Get all the aggregation results
        cursor.toArray(function(err, docs) {
          if (err) console.error(err);

          let allCount = 0;
          docs.forEach((doc) => {
            allCount += doc.count;
            const category = {
                _id: doc.category,
                num: doc.count
            };
            categories.push(category);
          });

          const allCategory = {
              _id: "All",
              num: allCount
          };

          categories.unshift(allCategory);
          callback(categories);
        });
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";
        page = page || 0;

        const filter = {};
        if (category && category !== 'All') {
          filter.category = category;
        }

        const skip = itemsPerPage * page;

        this.db.collection('item')
          .find(filter)
          .sort({_id: 1})
          .limit(itemsPerPage)
          .skip(skip)
          .toArray((err, docs) => {
            if (err) console.error(err);
            console.log('items', docs);
            const pageItems = docs;
            callback(pageItems);
          });
    }


    this.getNumItems = function(category, callback) {
        "use strict";

        var numItems = 0;

        const filter = {};
        if (category && category !== 'All') {
          filter.category = category;
        }

        this.db.collection('item')
          .find(filter)
          .count((err, numItems) => {
            if (err) console.error(err);
            callback(numItems);
          });
    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        const skip = itemsPerPage * page;

        this.db.collection('item')
          .find({$text:{$search: query}})
          .sort({_id:1})
          .limit(itemsPerPage)
          .skip(skip)
          .toArray((err, items) => {
            if (err) console.error(err);
            console.log('items', items);
            callback(items);
          });
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        this.db.collection('item')
          .find({$text:{$search: query}})
          .sort({_id:1})
          .count((err, numItems) => {
            if (err) console.error(err);
            console.log('numItems', numItems);

            callback(numItems);
          });
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        this.db.collection('item').findOne({_id: itemId})
          .then((item) => {
            console.log('item', item);

            callback(item);
          })
          .catch((err) => console.log(err));
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        /*
         * TODO-lab4
         *
         * LAB #4: Implement addReview().
         *
         * Using the itemId parameter, update the appropriate document in the
         * "item" collection with a new review. Reviews are stored as an
         * array value for the key "reviews". Each review has the fields:
         * "name", "comment", "stars", and "date".
         *
         */

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        // TODO replace the following two lines with your code that will
        // update the document with a new review.
        var doc = this.createDummyItem();
        doc.reviews = [reviewDoc];

        // TODO Include the following line in the appropriate
        // place within your code to pass the updated doc to the
        // callback.
        callback(doc);
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
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
