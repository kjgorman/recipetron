//client side user things

function User(name) {
    this.userName = name;
    this._currentUser = name;
}

User.__defineGetter__("currentUser", function() {
    return this._currentUser;
});

User.__defineSetter__("currentUser", function(user) {
    var oldCurrentUser = this.currentUser;
    this._currentUser = user;
    return oldCurrentUser;
})

User.prototype = {
    login : function(password, callback) {
        $.post("/login", {uname: this.userName, pwd: password},
               function(res) {
                   callback(res.logged_in_as);
               });
    },
    logout : function() {
        this.currentUser = undefined;
        $(".logged-in").remove();
        $(".logged-out").show();
    }
};