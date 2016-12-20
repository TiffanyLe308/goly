(function () {
    'use strict';
    angular.module('share.service.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('ShareServiceController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                        UserService, Notification, $location, GeneralService) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var token = UserService.getUserInfo();
            var currentUser;
            if (!token) {
                Notification.error({
                    message: 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            } else {
                currentUser = token.currentUser;
            }

            $scope.link = GeneralService.generateLink($scope.params.service, 'service', true);

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
                selectElementText(document.getElementById('invitation-link'));
                document.execCommand("copy");
            };

            $scope.trackShare = function (socialMedia) {
                if ($mixpanel) {
                    $mixpanel.track('SHARE', {
                        'Share Type': 'Service',
                        'Social Media': socialMedia,
                        'Sharer': $scope.isOwner ? 'Shop Owner' : 'User',
                        'Source': 'Share Service Dialog'
                    });
                }
            };
        });
}());
