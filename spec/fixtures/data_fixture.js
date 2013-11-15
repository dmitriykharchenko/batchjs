// not just like real fixture, but array every time the same

var huge_array = [];
var huge_hash = {};
var huge_array_indexes = [];

var huge_array_length = 5000;

for(var index = 0; index < huge_array_length; index ++){
  huge_array_indexes.push(index);
  huge_array.push({
    index: index
  });

  huge_hash[index + "_index"] = {
    index: index
  };
}