//creates notification popup thing

function Popup(text, x, y) {
    this.text = text && typeof text === 'string' ? text : null;
    this.x = x && typeof x === 'number' ? x : null;
    this.y = y && typeof y === 'number' ? y-10 : null; 
    var arrowDir = 'left';

    if(window && x < window.innerWidth/2) 
        this.x = 25 && arrowDir = 'right';
    else
        this.x = 1150;

    if(!$) throw "Popup depends on jquery because I am lazy"

    this._elem = $("<div class='js-popup "+'arrow_'+arrowDir+"'><span>"+text+"</span></div>");
    this._elem.css({
        "position":"absolute"
        ,"font-family":"Helvetica Neue"
        ,"color":"#222"
        ,"background-color":"rgba(225,225,225,0.6)"
        ,"padding":"10px"
        ,"border":"2px dashed #222"
        ,"border-radius":"5px"
        ,"top":this.y
        ,"left":this.x
        ,"z-index":10
    });
    $('body').append(this._elem)
    
}

Popup.atElement = function(el, text) {
    if(!el) throw "Cannot call `atElement` without providing an element"
    if(!$) throw "Popup depends on jquery because I am lazy"
    
    var offset = $(el).offset();
    
    return new Popup(text, offset.left, offset.top);
};

Popup.group = function(groupName, callback) {
    if(typeof groupName !== 'string') throw 'group name must be string'
    if(!this.groups) this.groups = {};
    if(!this.groups[groupName]) this.groups[groupName] = [];

    if(callback && typeof callback === 'function') {
        for(var i=0; i<this.groups[groupName].length; i += 1) {
            callback.call(this.groups[groupName][i]);
        }
    }

    return this.groups[groupName];
}

Popup.prototype = {
    appendText : function(text) {
        typeof text === 'string' && text = $("<span>"+text+"</span>");
        this._elem.append(text);
    },
    destroy : function() {
        $(this._elem).remove();
    }
};