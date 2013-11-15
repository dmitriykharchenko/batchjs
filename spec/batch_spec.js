describe('batch spec', function(){
  

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
            console.log("WANNA STOP")
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


    it("should find particular element", function(){})
  })
});