(function () {
    'use strict';
    angular.module('edit.service.controller', [
            'ui.router',
            'user.service',
            'ngAutocomplete'
        ])
        .controller('EditServiceController', function ($scope, $state, $uibModalInstance, Notification, $mixpanel, $uibModal,
                                                       UserService, ServiceService, GeneralService, Upload, CONFIG, $rootScope) {
            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////
            var service    = $scope.params.service;
            var shop       = $scope.params.shop;
            $scope.service = {
                id            : service.id,
                name          : service.name,
                description   : service.description,
                price         : service.price,
                discountRate  : service.discountRate,
                pictures      : [],
                subCategoryIds: [],
                currencySign  : service.currencySign
            };
            for (var i = 0; i < service.pictures.length; i++) {
                $scope.service.pictures.push(service.pictures[i]);
            }
            for (var j = 0; j < service.subCategoryIds.length; j++) {
                $scope.service.subCategoryIds.push(service.subCategoryIds[j]);
            }

            $scope.maxImageUpload                 = service.pictureSlot;
            $scope.maxEventType                   = CONFIG.maxEventType;
            $scope.availableSlotsToUploadPictures = $scope.maxImageUpload - $scope.service.pictures.length;
            $scope.title                          = $scope.service.name;
            $scope.description                    = $scope.service.description;
            $scope.price                          = $scope.service.price;
            $scope.selectedCategory               = $scope.service.subCategoryIds.length > 0 ? $scope.service.subCategoryIds[0] : null;
            $scope.isPlus                         = (shop.shopType == 'PREMIUM' || shop.shopType == 'PLUS') && shop.premiumExpiration > Date.now();
            $scope.isPremium                      = shop.shopType == 'PREMIUM' && shop.premiumExpiration > Date.now();

            // Get current user info
            // If not exist, redirect to login page
            var token = UserService.getUserInfo();
            var currentUser;
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

            // Load Categories and Sub-Categories
            GeneralService.listCategory(function (response) {
                if (response.status == 'OK') {
                    $scope.categories            = response.categories;
                    $scope.selectedSubCategories = [];
                } else {
                    Notification.error({
                        message  : response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });

            // Load service own event type
            $scope.eventType = [];
            if (service.tags && service.tags.length > 0) {
                service.tags.forEach(function (tag) {
                    $scope.eventType.push({text: tag});
                });
            }

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

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
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

            $scope.uploadFile = function (files) {
                if (files && files.length > 0) {
                    if ($mixpanel) {
                        $mixpanel.track('SHOP > ADD SERVICE IMAGE', {
                            'Service Name'        : service.name,
                            'Service Category'    : service.categoryName,
                            'Service Sub-category': service.subCategoryNames[0]
                        });
                    }

                    angular.forEach(files, function (file) {
                        // Check file limit
                        if ($scope.availableSlotsToUploadPictures > 0 || $scope.isPlus) {
                            $scope.availableSlotsToUploadPictures--;
                            ServiceService.uploadPicture(service.shopId, file, function (response) {
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

            $scope.save = function () {
                service.tags = [];
                if ($scope.eventType !== undefined) {
                    if ($scope.eventType.length > CONFIG.maxEventType) {
                        Notification.error({
                            message  : 'You can only choose maximum ' + CONFIG.maxEventType + ' types of event',
                            positionY: 'top',
                            positionX: 'center'
                        });
                        return;
                    }

                    $scope.eventType.forEach(function (tag) {
                        service.tags.push(tag.text);
                    });
                }
                service.name           = $scope.title;
                service.description    = $scope.description;
                service.price          = $scope.price;
                service.subCategoryIds = [$scope.selectedCategory];
                service.pictures       = $scope.service.pictures;
                service.draft          = false;

                ServiceService.saveService(
                    service,
                    function (response) {
                        if (response.status == 'OK') {
                            Notification.success({
                                message  : 'Service info has been updated successfully.',
                                positionY: 'top',
                                positionX: 'center'
                            });

                            // Finishing editing service
                            if ($mixpanel) {
                                $mixpanel.track('SHOP > EDIT SERVICE', {
                                    'Service Name'        : response.service.name,
                                    'Service Category'    : response.service.categoryName,
                                    'Service Sub-category': response.service.subCategoryNames[0]
                                });
                            }

                            $uibModalInstance.close();

                            var scope         = $rootScope.$new();
                            scope.params      = {service: service};
                            var modalInstance = $uibModal.open({
                                scope      : scope,
                                animation  : true,
                                templateUrl: 'modules/modal-template/share-service/share-service.html',
                                controller : 'ShareServiceController',
                                size       : 'lg'
                            });
                        } else {
                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };

            $scope.showDeleteWarning = function () {
                $scope.deleteWarning = true;
            };

            $scope.deleteService = function () {
                var shopId = service.shopId;

                if ($mixpanel) {
                    $mixpanel.track('SHOP > DELETE SERVICE', {
                        'Service Name'        : service.name,
                        'Service Category'    : service.categoryName,
                        'Service Sub-category': service.subCategoryNames[0],
                    });
                }

                ServiceService.removeService(service.id, function (response) {
                    if (response.status == 'OK') {
                        Notification.success({
                            message  : 'Service info has been updated successfully.',
                            positionY: 'top',
                            positionX: 'center'
                        });

                        $state.go('shop', {'shopId': shopId});
                        $uibModalInstance.dismiss();
                    } else {
                        Notification.error({
                            message  : response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });
            };

            $scope.cancelDelete = function () {
                $scope.deleteWarning = false;
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
