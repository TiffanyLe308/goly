(function () {
    'use strict';
    angular.module('edit.shop.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('EditShopController', function ($scope, $state, $uibModalInstance, uiGmapGoogleMapApi, $mixpanel,
                                                    UserService, GeneralService, ShopService, Notification, $uibModal,
                                                    $rootScope) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var token = UserService.getUserInfo();
            var currentUser;
            if (!token) {
                Notification.error({
                    message  : 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            } else {
                currentUser = token.currentUser;
            }

            // Get shop Id
            var shopId = $scope.params.shop.id;

            $scope.shop        = angular.copy($scope.params.shop);
            $scope.isPlus      = ($scope.shop.shopType == 'PREMIUM' || $scope.shop.shopType == 'PLUS') && $scope.shop.premiumExpiration > Date.now();
            $scope.isPremium   = $scope.shop.shopType == 'PREMIUM' && $scope.shop.premiumExpiration > Date.now();
            $scope.socialLinks = {};

            if ($scope.isPlus && $scope.shop.listSocialLinks) {
                $scope.socialLinks.phone     = _.find($scope.shop.listSocialLinks, {'name': 'phone'});
                $scope.socialLinks.website   = _.find($scope.shop.listSocialLinks, {'name': 'website'});
                $scope.socialLinks.facebook  = _.find($scope.shop.listSocialLinks, {'name': 'facebook'});
                $scope.socialLinks.instagram = _.find($scope.shop.listSocialLinks, {'name': 'instagram'});
                $scope.socialLinks.twitter   = _.find($scope.shop.listSocialLinks, {'name': 'twitter'});
            }


            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            var isUrl = function (s) {
                var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                return regexp.test(s);
            };

            var isTwitterUsername = function (s) {
                var regexp = /^@?(\w){1,15}$/;
                return regexp.test(s);
            };

            var isFacebookUsername = function (s) {
                var regexp = /^[a-z\d.]{3,50}$/i;
                return regexp.test(s);
            };

            var isInstagramUsername = function (s) {
                var regexp = /^[a-z\d._]{1,20}$/i;
                return regexp.test(s);
            };

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.options = {
                country: currentUser.country
            };

            $scope.editShop = function () {
                uiGmapGoogleMapApi.then(function (maps) {
                    var geocoder = new maps.Geocoder();

                    geocoder.geocode({
                        address: $scope.shop.address
                    }, function (results, status) {

                        if (!(results && results[0] && results[0].geometry)) {
                            Notification.error({
                                message  : 'Please enter valid address',
                                positionY: 'top',
                                positionX: 'center'
                            });
                            $scope.location = '';
                            return;
                        }

                        $scope.shop.location = {
                            lat: results[0].geometry.location.lat(),
                            lon: results[0].geometry.location.lng()
                        };

                        $scope.shop.city = null;
                        results[0].address_components.forEach(function (item) {
                            if (item.types[0] == "administrative_area_level_3") {
                                $scope.shop.city = item.long_name;
                            } else if (item.types.indexOf("locality") != -1 && $scope.shop.city === null) {
                                $scope.shop.city = item.long_name;
                            }
                        });

                        // Could not get city from location
                        if ($scope.shop.city === null) {
                            Notification.error({
                                message  : 'Could not find the city name in your address. Please enter valid address!',
                                positionY: 'top',
                                positionX: 'center'
                            });
                            $scope.location = '';
                            return;
                        }

                        var completed = {
                            info  : false,
                            payout: $scope.shop.payoutAccount === null // No need to consider payout if there is no info
                        };

                        // Save social links
                        if ($scope.isPlus) {
                            var socialLinksValidation = true;

                            $scope.shop.listSocialLinks = [];
                            _.forIn($scope.socialLinks, function (socialLink, name) {
                                if (socialLink && socialLink.link) {
                                    // Validate before saving
                                    if (name == 'website' && !isUrl(socialLink.link)) {
                                        Notification.error({
                                            message  : 'Please enter valid Website link',
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                        socialLinksValidation = false;
                                        return;
                                    } else if (name == 'facebook' && !isFacebookUsername(socialLink.link)) {
                                        Notification.error({
                                            message  : 'Please enter valid Facebook username',
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                        socialLinksValidation = false;
                                        return;
                                    } else if (name == 'twitter' && !isTwitterUsername(socialLink.link)) {
                                        Notification.error({
                                            message  : 'Please enter valid Twitter username',
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                        socialLinksValidation = false;
                                        return;
                                    } else if (name == 'instagram' && !isInstagramUsername(socialLink.link)) {
                                        Notification.error({
                                            message  : 'Please enter valid Instagram username',
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                        socialLinksValidation = false;
                                        return;
                                    }

                                    socialLink.name = name;
                                    $scope.shop.listSocialLinks.push(socialLink);
                                }
                            });

                            if (!socialLinksValidation) {
                                return;
                            }
                        }

                        // Finishing editing shop
                        if ($mixpanel) {
                            $mixpanel.track('SHOP > EDIT SHOP', {
                                'Shop Name'    : $scope.shop.name,
                                'Provider Type': $scope.shop.providerType
                            });
                        }

                        ShopService.saveShop(
                            $scope.shop,
                            function (response) {

                                if (response.status === 'OK') {
                                    completed.info = true;
                                    if (completed.payout) {
                                        $uibModalInstance.close();
                                    }
                                } else {
                                    Notification.error({
                                        message  : response.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
                                }
                            }
                        );

                        // Save payout infor
                        if ($scope.shop.payoutAccount !== null) {
                            ShopService.registerPayout(
                                $scope.shop.id,
                                $scope.shop.payoutAccount.bankAccount,
                                $scope.shop.payoutAccount.bankName,
                                $scope.shop.payoutAccount.firstName,
                                $scope.shop.payoutAccount.lastName,
                                'BANK',
                                function (response) {

                                    if (response.status === 'OK') {
                                        completed.payout = true;
                                        if (completed.info) {
                                            $uibModalInstance.close();
                                        }
                                    } else {
                                        Notification.error({
                                            message  : response.message,
                                            positionY: 'top',
                                            positionX: 'center'
                                        });
                                    }
                                }
                            );
                        }
                    });
                });
            };

            $scope.getPlus = function () {
                var scope             = $rootScope.$new();
                scope.enableComparing = true;

                var modalInstance = $uibModal.open({
                    scope      : scope,
                    animation  : true,
                    templateUrl: 'modules/modal-template/get-plus/get-plus.html',
                    controller : 'GetPlusController',
                    size       : 'lg'
                });

                modalInstance.result.then(function () {

                }, function () {

                });
            };
        });
}());
