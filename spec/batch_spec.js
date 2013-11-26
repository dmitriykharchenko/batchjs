describe('batch spec', function(){
  
  describe("chaining", function(){
    var worker = null;

    beforeEach(function(){
      worker = batch(huge_array);
    });

    it("should use specified data", function(){
      var results = null

      runs(function() {
        worker.use([1,2,3,4,5,6,7]).map(function(item, index){
          return (item / 3) | 0; // divide by three and take floor
        }).reduce(function(item, index, summary){
          return (summary || 0) + item;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toBe(7);
      });
    });

    it("should make map reduce", function(){
      var results = null

      runs(function() {
        worker.map(function(item, index){
          return (item.index / 3) | 0; // divide by three and take floor
        }).reduce(function(item, index, summary){
          return (summary || 0) + item;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toBe(4164167);
      });
    });

    it("next handler should not affect results", function(){
      var results = null;

      runs(function() {
        worker.find(function(item, index){
          return (+item.index % 42) + (+item.index % 13) === 0 && +item.index !== 0;
        }).next(function(data){
          return "nothing!";
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual({ index : 546 });
      });
    });
  });

  describe("iterate trought hash of data", function(){
    var worker = null;

    beforeEach(function(){
      worker = batch(huge_hash);
    });

    it("should iterate trough each element of hash", function(){
        
      var count = 0;
      var is_completed = false;

      runs(function() {
        worker.each(function(item, index){
          count ++;
        }).next(function(){
          is_completed = true;
        });
      });

      waitsFor(function(){
        return is_completed;
      });

      runs(function() {
        expect(count).toBe(huge_array.length);
      });
    });


    it("should abort iteration trough each element at the 500th element of hash", function(){
        
      var count = 0;
      var is_completed = false;

      runs(function() {
        worker.each(function(item, index){
          count ++;
          if(index === "499_index"){
            return false;
          }
        }).next(function(){
          is_completed = true;
        });
      });

      waitsFor(function(){
        return is_completed;
      });

      runs(function() {
        expect(count).toBeLessThan(5000);
      });
      
    });

    it("should map each element of hash", function(){
        
      var results = null;

      runs(function() {
        worker.map(function(item, index){
          return item.index;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual(huge_hash_indexes);
      });
    });


    it("should reduce array to summ of index field of each element of hash", function(){
      var results = null;

      runs(function() {
        worker.reduce(function(item, index, summary){
          return (summary || 0 ) + item.index;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toBe(12497500);
      });
    });


    it("should find first element with index dividable by 42 and 13", function(){
      var results = null;

      runs(function() {
        worker.find(function(item, index){
          return (+item.index % 42) + (+item.index % 13) === 0 && +item.index !== 0;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual({ index : 546 });
      });
    });

    it("should select all items with index field dividable by 43", function(){
      var results = null;

      runs(function() {
        worker.select(function(item, index){
          return (item.index % 43) === 0;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual(dividable_by_43_items_array);
      });
    });
  });

  describe("iterate trought array of data", function(){
    var worker = null;

    beforeEach(function(){
      worker = batch(huge_array);
    });

    it("should iterate trough each element of array", function(){
        
      var count = 0;
      var is_completed = false;

      runs(function() {
        worker.each(function(item, index){
          count ++;
        }).next(function(){
          is_completed = true;
        });
      });

      waitsFor(function(){
        return is_completed;
      });

      runs(function() {
        expect(count).toBe(huge_array.length);
      });
    });


    it("should abort iteration trough each element at the 500th element of array", function(){
        
      var count = 0;
      var is_completed = false;

      runs(function() {
        worker.each(function(item, index){
          count ++;
          if(index === 499){
            return false;
          }
        }).next(function(){
          is_completed = true;
        });
      });

      waitsFor(function(){
        return is_completed;
      });

      runs(function() {
        expect(count).toBe(500);
      });
      
    });

    it("should map each element of array", function(){
        
      var results = null;

      runs(function() {
        worker.map(function(item, index){
          return index;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual(huge_array_indexes);
      });
    });


    it("should reduce array to summ of index field of each element of array", function(){
      var results = null;

      runs(function() {
        worker.reduce(function(item, index, summary){
          return (summary || 0 ) + item.index;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toBe(12497500);
      });
    });


    it("should find first element with index dividable by 42 and 13", function(){
      var results = null;

      runs(function() {
        worker.find(function(item, index){
          return (+item.index % 42) + (+item.index % 13) === 0 && +item.index !== 0;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual({ index : 546 });
      });
    });

    it("should select all items with index field dividable by 43", function(){
      var results = null;

      runs(function() {
        worker.select(function(item, index){
          return (item.index % 43) === 0;
        }).next(function(data){
          results = data;
        });
      });

      waitsFor(function(){
        return results !== null;
      });

      runs(function() {
        expect(results).toEqual(dividable_by_43_items_array);
      });
    });
  })
});