(function () {
    'use strict';
    angular.module('change.number.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('ChangeNumberController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                        UserService, GeneralService, ShopService, Notification, CONFIG) {

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////
            $scope.SMSCodeSent = false;
            $scope.supportCountries = CONFIG.supportCountries;

            var token = UserService.getUserInfo();
            var currentUser = token.currentUser;
            $scope.currentNumber = currentUser.phone;
            $scope.newPhoneNumber = Number(currentUser.phone);
            $scope.newCountry =  currentUser.phoneCountryCode;

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.changePhoneNumber = function () {
                // Track in Mixpanel
                if ($mixpanel) {
                    $mixpanel.track('USER > CHANGE PHONE', {});
                }

                UserService.changePhoneNumber(
                    $scope.newCountry,
                    $scope.newPhoneNumber,
                    function (response) {
                        if (response.status == 'OK') {
                            // $scope.SMSCodeSent = true;
                            // // $uibModalInstance.close();
                            $uibModalInstance.close();
                            UserService.logout();
                            $state.go('login');
                        } else {
                            Notification.error({
                                message: response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };

            $scope.confirmSMSCode = function (SMSCode) {
                UserService.verifySMS(
                    currentUser.id,
                    SMSCode,
                    function (response) {
                        if (response.status == 'OK') {
                            Notification.success({
                                message : response.message,
                                positionY : 'top',
                                positionX : 'center'
                            });
                            $uibModalInstance.close();
                        } else {
                            Notification.error({
                                message: response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };

        });
}());
