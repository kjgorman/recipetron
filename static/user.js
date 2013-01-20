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
    login : function(password, callback, error) {
        $.post("/login", {uname: this.userName, pwd: password},
               function(res) {
                   callback(res.logged_in_as);
               }).fail(function () {
                   error && error();
               });
    },
    logout : function() {
        $.post('/logout', function() {
            User.currentUser = undefined;
            $(".logged-in").remove();
            $(".logged-out").show();
        });
    }
};