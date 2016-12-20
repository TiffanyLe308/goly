(function () {
    'use strict';
    angular.module('send.invitation.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('SendInvitationController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                          UserService, Notification, $location) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var currentUser = UserService.requiredLogin(true);
            if (!currentUser) {
                return;
            }

            $scope.link = $location.protocol() + '://' + $location.host() + '/invite/' + currentUser.id;

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            var selectElementText = function (el) {
                var range = document.createRange();
                range.selectNodeContents(el);
                var selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            };

            $scope.copyLink = function () {
                if ($mixpanel) {
                    $mixpanel.track('USER > INVITE', {
                        'Method': 'Copy Link'
                    });
                }

                selectElementText(document.getElementById('invitation-link'));
                document.execCommand("copy");
            };
        });
}());
