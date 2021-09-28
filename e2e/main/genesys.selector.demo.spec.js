'use strict';
/*
describe('genesys selector demo', function() {
    beforeEach(function() {
        browser.ignoreSynchronization = true;
    });

    var startInteraction = function() { 
        return browser.driver
        .findElement(by.className('cx-submit' ))
        .then(function(element){
            element.click();
            return true;
        }, function(err) {
            return false;
        });
    };

    var startChannel = function() {
        
        return browser.driver
        .findElement(by.id('cx-Channel00' ))
        .then(function(element){
            element.click();
            return true;
        }, function(err) {
            return false;
        });
    };

    //genesys selector demo
    it('should open precall ', function() {
        browser.get('http://localhost:3000/genesys-selector-demo.html');
        browser.sleep(1000);
        //click sidebar
        element(by.xpath('/html/body/ul/li[1]/div')).click();
        //browser.switchTo().frame('videoengageriframe');
        //click channel
        browser.driver.wait( startChannel , 10000);  
        //click start
        browser.driver.wait( startInteraction , 10000);  
        browser.sleep(1000);
        browser.switchTo().window(1);
    });
});
*/
