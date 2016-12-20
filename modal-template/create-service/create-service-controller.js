(function () {
    'use strict';
    angular.module('create.service.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('CreateServiceController', function ($scope, $state, $uibModalInstance, Notification, $mixpanel, $rootScope,
                                                         filterFilter, UserService, ServiceService, GeneralService, Upload, CONFIG,
                                                         $uibModal) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////
            // Get current user info
            // If not exist, redirect to login page
            var token     = UserService.getUserInfo();
            var currentUser;
            var submitted = false;
            var country;
            if (!token) {
                Notification.error({
                    message  : 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            } else {
                currentUser = token.currentUser;
                country     = currentUser.country;
            }

            // Get params
            $scope.shop             = $scope.params.shop;
            $scope.maxEventType     = CONFIG.maxEventType;
            $scope.service          = {};
            $scope.service.id       = null;
            $scope.service.pictures = [];
            $scope.service.shopId   = $scope.shop.id;
            $scope.service.draft    = false;
            if ($scope.params.group !== undefined) {
                $scope.service.groupId = $scope.params.group.id;
            }

            $scope.maxImageUpload                 = 5;
            $scope.availableSlotsToUploadPictures = $scope.maxImageUpload - $scope.service.pictures.length;
            $scope.currencySign                   = CONFIG.supportCountries[$scope.shop.country].currencySign;
            $scope.isPlus                         = ($scope.shop.shopType == 'PREMIUM' || $scope.shop.shopType == 'PLUS') && $scope.shop.premiumExpiration > Date.now();
            $scope.isPremium                      = $scope.shop.shopType == 'PREMIUM' && $scope.shop.premiumExpiration > Date.now();

            // Load Categories and Sub-Categories
            GeneralService.listCategory(function (response) {
                if (response.status == 'OK') {
                    $scope.categories            = response.categories;
                    $scope.selectedSubCategories = [];
                    $scope.selectedCategory      = null;
                } else {
                    Notification.error({
                        message  : response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });

            // Load all Event Type to dropdown
            GeneralService.listAllTags(country, function (response) {
                if (response.status == 'OK') {
                    $scope.eventTypeTags = [];
                    response.tags.forEach(function (tag) {
                        $scope.eventTypeTags.push({text: tag});
                    });
                } else {
                    Notification.error({
                        message  : response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.range = function (num) {
                var arr = [];
                for (var i = 0; i < num; i++) {
                    arr.push(i);
                }
                return arr;
            };

            $scope.deleteFile = function (imageName) {
                var deleteIndex = -1;
                for (var i = 0; i < $scope.service.pictures.length; i++) {
                    if ($scope.service.pictures[i] == imageName) {
                        deleteIndex = i;
                        break;
                    }
                }
                if (deleteIndex > -1) {
                    $scope.service.pictures.splice(deleteIndex, 1);
                }
                // Refresh available upload image
                $scope.availableSlotsToUploadPictures = $scope.maxImageUpload - $scope.service.pictures.length;
            };

            $scope.getThumbnail = function (url) {
                return GeneralService.getThumbnail(url);
            };

            $scope.uploadFile = function (files) {
                if (files && files.length > 0) {

                    if ($mixpanel) {
                        $mixpanel.track('SHOP > ADD SERVICE IMAGE', {});
                    }

                    angular.forEach(files, function (file) {
                        // Check file limit
                        if ($scope.availableSlotsToUploadPictures > 0 || $scope.isPlus) {
                            $scope.availableSlotsToUploadPictures--;
                            ServiceService.uploadPicture($scope.shop.id, file, function (response) {
                                if (response.status == 'OK') {
                                    for (var i = 0; i < response.urls.length; i++) {
                                        $scope.service.pictures.push(response.urls[i]);
                                    }
                                } else {
                                    $scope.availableSlotsToUploadPictures++;
                                    Notification.error({
                                        message  : response.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
                                }
                            });
                        }
                    });
                }
            };

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.save = function (eventType, selectedCategory) {
                if (submitted) {
                    return;
                }
                submitted = true;

                if (!selectedCategory) {
                    Notification.error({
                        message  : 'Please select a category for your service',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }

                $scope.service.subCategoryIds = [selectedCategory];
                $scope.service.tags           = [];
                if (eventType !== undefined) {
                    if (eventType.length > CONFIG.maxEventType) {
                        Notification.error({
                            message  : 'You can only choose maximum ' + CONFIG.maxEventType + ' types of event',
                            positionY: 'top',
                            positionX: 'center'
                        });
                        return;
                    }

                    eventType.forEach(function (tag) {
                        $scope.service.tags.push(tag.text);
                    });
                }

                ServiceService.saveService(
                    $scope.service,
                    function (response) {
                        if (response.status == 'OK') {
                            Notification.success({
                                message  : 'Service info has been saved successfully.',
                                positionY: 'top',
                                positionX: 'center'
                            });
                            $scope.serviceId = response.service.id;

                            // Track
                            if ($mixpanel) {
                                $mixpanel.track('SHOP > ADD SERVICE', {
                                    'Service Name'        : response.service.name,
                                    'Service Category'    : response.service.categoryName,
                                    'Service Sub-category': response.service.subCategoryNames[0]
                                });
                            }

                            $uibModalInstance.close();

                            var scope         = $rootScope.$new();
                            scope.params      = {service: response.service};
                            var modalInstance = $uibModal.open({
                                scope      : scope,
                                animation  : true,
                                templateUrl: 'modules/modal-template/share-service/share-service.html',
                                controller : 'ShareServiceController',
                                size       : 'lg'
                            });
                        } else {
                            submitted = false;

                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
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
