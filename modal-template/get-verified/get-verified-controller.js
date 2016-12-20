(function () {
    'use strict';
    angular.module('get.verified.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('GetVerifiedController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                       UserService, GeneralService, ShopService, Notification, Facebook) {

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

            // Get shop Id
            var shop = $scope.params.shop;
            var shopId = shop.id;

            $scope.isVerifyEmail = currentUser.isVerifyEmail;
            $scope.isVerifyFB = currentUser.isVerifyFB;

            $scope.isVerifyBussinessId = shop.isVerifyBussinessId;
            $scope.isPendingVerifyBusiness = shop.isPendingVerifyBusiness;

            $scope.verifyingEmail = false;
            $scope.verifyingBusiness = false;

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            // Show Business verification process
            $scope.triggerVerifyingBusiness = function () {
                $scope.verifyingBusiness = true;
                $scope.idUploaded = false;
            };

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.sendVerifyEmail = function () {
                if ($mixpanel) {
                    $mixpanel.track('SHOP > VERIFY', {
                        'Verify Type': 'Email'
                    });
                }

                UserService.sendVerifyEmail(
                    function (response) {
                        if (response.status == 'OK') {
                            $scope.verifyingEmail = true;
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

            $scope.registerWithFB = function () {
                if ($mixpanel) {
                    $mixpanel.track('SHOP > VERIFY', {
                        'Verify Type': 'Facebook',
                        'Shop Name': shop.name,
                        'Provider Type': shop.providerType
                    });
                }

                Facebook.login(function (loginResponse) {

                    if (loginResponse.status == 'connected') {
                        Facebook.api('/me', function (res) {

                            UserService.validateFacebook(
                                res.id, //facebookId
                                function (response) {

                                    if (response.status == 'OK') {
                                        $scope.facebookId = res.id;
                                        $scope.firstName = res.first_name;
                                        $scope.lastName = res.last_name;
                                        $scope.email = res.email;
                                        $scope.signUpWithFacebook = true;
                                        $scope.registerText = 'Confirm';
                                        $scope.profilePhoto = 'http://graph.facebook.com/' + res.id + '/picture?type=large';

                                        $scope.isVerifyFB = true;
                                    } else {
                                        Notification.error({
                                            message: response.message,
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                    }

                                }
                            );
                        });
                    }
                });
            };

            $scope.uploadId = function (file) {
                if (file === null || file === undefined) {
                    return;
                }
                ShopService.uploadBusinessIdPhoto(shopId, file, function (response) {
                    if (response.status == 'OK') {
                        $scope.businessIdUrl = response.urls[0];
                        shop.idPhotos = response.urls;
                        $scope.idUploaded = true;
                    } else {
                        Notification.error({
                            message: response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });
            };

            $scope.submitId = function () {
                if ($mixpanel) {
                    $mixpanel.track('SHOP > VERIFY', {
                        'Verify Type': 'ID',
                        'Shop Name': shop.name,
                        'Provider Type': shop.providerType
                    });
                }

                ShopService.saveShop(
                    shop, function (response) {
                        if (response.status == 'OK') {
                            $uibModalInstance.close();
                        } else {
                            Notification.error({
                                message: response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    });
            };
        });
}());
