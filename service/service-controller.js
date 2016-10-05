(function () {
    'use strict';
    angular.module('service.controller', [
            'ui.router',
            'user.service'
        ])

        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('service', {
                    url: '/service/:serviceName/{serviceId}',
                    templateUrl: 'modules/service/service.html',
                    controller: 'serviceController',
                    params: {
                        serviceId: {value: null, squash: true}
                    }
                });
        }])

        .controller('serviceController', function ($rootScope, $scope, $state, $mixpanel, uiGmapGoogleMapApi,
                                                   UserService, GeneralService, ServiceService, CONFIG, ShopService,
                                                   Notification, $stateParams, $uibModal, Lightbox, $location) {
            /////////////////////////////////////////////
            /////////////// INITIAL DATA ////////////////
            /////////////////////////////////////////////
            var serviceId = $state.params.serviceId;
            var serviceName = $state.params.serviceName;
            if (!serviceId) {
                // Old link, reassign serviceId
                serviceId = serviceName;
                serviceName = null;
            }

            var token             = $rootScope.userSession;
            var shopId;
            $scope.currentUrl     = $location.absUrl();
            $scope.moreFromSeller = [];
            var processCount      = 0;

            // Redirect old service link to new one
            var redirect = function (service) {
                var slug = GeneralService.convertToSlug(service.name);

                // Set Prerender header
                $rootScope.pageStatusCode = '302';
                $rootScope.prerenderHeader = 'Location: ' + GeneralService.generateLink(service, 'service', true);

                $state.go('service', {
                    serviceName: slug,
                    serviceId: service.id
                });
            };

            if ($('html').hasClass('mobile')) {
                $scope.isMobile = true;
            }

            var isReady = function () {
                processCount++;
                // Check if processCount equal total number of processed in this page
                if (processCount == 3) {
                    // Set the flag so that Prerender knows that it is ready
                    window.prerenderReady = true;
                    $scope.initialised = true;

                    // Prepare the tutorial
                    if (token) {
                        if ($scope.isOwner && token.currentUser.tutorials.indexOf('my-service') == -1) {
                            $scope.intro = {
                                name: 'my-service',
                                steps: [
                                    {
                                        element: '#intro-service-edit',
                                        content: "Edit your service details, add or remove service images.",
                                        placement: 'top'
                                    },
                                    {
                                        element: '#intro-service-share',
                                        content: "Share your service on social networks to promote your service.",
                                        placement: 'top'
                                    }
                                ]
                            };
                        } else if (!$scope.isOwner && token.currentUser.tutorials.indexOf('service') == -1) {
                            $scope.intro = {
                                name: 'service',
                                steps: [
                                    {
                                        element: '#intro-service-order',
                                        content: "Book this service.",
                                        placement: 'top'
                                    },
                                    {
                                        element: '#intro-service-message',
                                        content: "If you have any question or want to know more about the service, you can send a message to the seller of this service.",
                                        placement: 'top'
                                    },
                                    {
                                        element: '#intro-service-provider',
                                        content: "Click here to view the shop profile.",
                                        placement: 'top'
                                    },
                                    {
                                        element: '#intro-service-address',
                                        content: "Click here to view shop's location on the map.",
                                        placement: 'top'
                                    },
                                    {
                                        element: 'div.service-gallery-image:first-of-type',
                                        content: "Click on an image to enlarge the image.",
                                        placement: 'bottom'
                                    },
                                    {
                                        element: '#intro-service-favorite',
                                        content: "Click here to save this service into your Favorites.",
                                        placement: 'top'
                                    },
                                    {
                                        element: '#intro-service-share',
                                        content: "Share this service on social networks to your family and friends.",
                                        placement: 'top'
                                    }
                                ]
                            };
                        }
                        $scope.$broadcast('dataloaded');
                    }

                    // Track view with MixPanel
                    if ($mixpanel) {
                        $mixpanel.track('VIEW', {
                            'View Type'           : 'Service',
                            'Service Name'        : $scope.service.name,
                            'Service Category'    : $scope.service.categoryName,
                            'Service Sub-category': $scope.service.subCategoryNames[0],
                            'Goly Grade'          : $scope.service.golyGrade,
                            'Shop Name'           : $scope.shop.name,
                            'Rating'              : $scope.service.ratings,
                            'Starting Price'      : $scope.service.price,
                            'Provider Type'       : $scope.shop.providerType,
                            'Verified'            : $scope.shop.isVerifyBussinessId
                        });
                    }
                }
            };

            // Prepare the init flag
            $scope.initialised = false;


            // Get service info
            ServiceService.getService(serviceId, function (response) {
                if (response.status == 'OK') {
                    if (!serviceName || serviceName != GeneralService.convertToSlug(response.service.name)) {
                        redirect(response.service);
                    }

                    // Loading metadata
                    if ($state.current.name == 'service') {
                        $rootScope.pageTitle = response.service.name;
                        $rootScope.pageDescription = response.service.description;

                        if (response.service.pictures.length > 0) {
                            $rootScope.pageImage = response.service.pictures[0];
                        }
                    }

                    if (!serviceName || serviceName != GeneralService.convertToSlug(response.service.name)) {
                        redirect(response.service);
                    }

                    $scope.service = response.service;
                    $scope.averageRate = response.service.ratings;

                    // Preparing pictures for Lightbox
                    $scope.pictures = [];
                    for (var i = 0; i < response.service.pictures.length; i++) {
                        $scope.pictures.push({'url': $scope.service.pictures[i]});
                    }

                    isReady();

                    // Track view with Facebook
                    if (fbq) {
                        fbq('track', 'ViewContent', {
                            value: $scope.service.price,
                            currency: $scope.service.currency,
                            content_name: $scope.service.name,
                            content_type: 'product',
                            content_ids: $scope.service.id
                        });
                    }
                } else {
                    Notification.error({
                        message: response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                    $state.go('explore');
                }
            });

            // Get service shop info
            ShopService.getServiceProvider(serviceId, function (response) {
                if (response.status == 'OK') {
                    $scope.shop = response.shop;
                    shopId      = response.shop.id;

                    // Retrieve social links information if plus shop
                    if (GeneralService.global.isPlus($scope.shop) && $scope.shop.listSocialLinks) {
                        $scope.socialLinks           = {};
                        $scope.socialLinks.phone     = _.find($scope.shop.listSocialLinks, {'name': 'phone'});
                        $scope.socialLinks.website   = _.find($scope.shop.listSocialLinks, {'name': 'website'});
                        $scope.socialLinks.facebook  = _.find($scope.shop.listSocialLinks, {'name': 'facebook'});
                        $scope.socialLinks.instagram = _.find($scope.shop.listSocialLinks, {'name': 'instagram'});
                        $scope.socialLinks.twitter   = _.find($scope.shop.listSocialLinks, {'name': 'twitter'});
                    }


                    // When on mobile, if service is not the current service and number of services in moreFromSeller is less than 4,
                    // add service to moreFromSeller array. When not on mobile, if service is not the current service, add to array.
                    response.services.forEach(function (service) {
                        if ($scope.isMobile) {
                            if (service.id != serviceId) {
                                $scope.moreFromSeller.push(service);
                            }
                        } else {
                            if ((service.id != serviceId) && ($scope.moreFromSeller.length < 4)) {
                                $scope.moreFromSeller.push(service);
                            }
                        }
                    });

                    if (token && token.currentUser) {
                        $scope.isOwner = response.shop.userId == token.currentUser.id;
                    }

                    isReady();
                } else {
                    //Do nothing here, as the service may not be found
                }
            });

            // Get reviews by SP
            ServiceService.listReviewsBySP(serviceId, function (response) {
                if (response.status == 'OK') {
                    $scope.listReviews = response.reviews;

                    isReady();
                } else {
                    //Do nothing here, as the service may not be found
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

            $scope.timeAgoCreation = function (time) {
                return moment(time).fromNow();
            };

            $scope.toggleFavoriteService = function (serviceId) {
                if (!token.currentUser) {
                    Notification.error({
                        message: 'Cannot identify user. Please login first!',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }

                if ($scope.isFavoriteService(serviceId)) {
                    UserService.removeFavoriteService(
                        serviceId,
                        function (response) {
                            if (response.status == 'OK') {

                                Notification.success({
                                    message: response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });
                            } else {
                                Notification.error({
                                    message: response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });
                            }
                        }
                    );
                } else {
                    if (fbq) {
                        fbq('track', 'AddToWishlist', {
                            value: $scope.service.price,
                            currency: $scope.service.currency,
                            content_name: $scope.service.name,
                            content_type: 'Service',
                            content_ids: $scope.service.id
                        });
                    }

                    UserService.addToFavoriteService(
                        serviceId,
                        function (response) {
                            if (response.status == 'OK') {

                                Notification.success({
                                    message: response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });
                            } else {
                                Notification.error({
                                    message: response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });
                            }
                        }
                    );
                }
            };

            $scope.isFavoriteService = function (serviceId) {
                if (token && token.currentUser) {
                    return (token.currentUser.favoriteServiceIds.indexOf(serviceId) != -1);

                }
                return null;
            };

            $scope.openEditMyServiceModel = function () {
                var scope         = $rootScope.$new();
                scope.params      = {
                    service: $scope.service,
                    shop   : $scope.shop
                };
                var modalInstance = $uibModal.open({
                    scope: scope,
                    animation: true,
                    backdrop: 'static',
                    templateUrl: 'modules/modal-template/edit-service/edit-service.html',
                    controller: 'EditServiceController',
                    size: 'lg'
                });

                modalInstance.result.then(function () {
                    $state.go($state.current, {}, {reload: true});
                }, function () {
                });

            };

            $scope.openOrderServiceModal = function (serviceId, shopId) {
                var scope = $rootScope.$new();
                scope.params = {
                    serviceId: serviceId,
                    shopId: shopId
                };
                var modalInstance = $uibModal.open({
                    scope: scope,
                    animation: true,
                    templateUrl: 'modules/modal-template/create-order/create-order.html',
                    controller: 'CreateOrderController',
                    size: 'lg'
                });

                modalInstance.result.then(function (orderId) {
                    // User created an order
                    $state.go('orders.detail', {'orderId': orderId});
                }, function () {
                    // User close the Order modal
                });

                if ($mixpanel) {
                 $mixpanel.track('POPUP', {
                     'Type': 'Service Request'
                  });
                }
            };

            $scope.openSendMessageModal = function (serviceId, shopId) {
                var scope = $rootScope.$new();
                scope.params = {
                    type: 'TEXT',
                    serviceId: serviceId,
                    shopId: shopId
                };
                var modalInstance = $uibModal.open({
                    scope      : scope,
                    animation  : true,
                    templateUrl: 'modules/modal-template/send-message/text.html',
                    controller : 'SendMessageController',
                    size       : 'lg'
                });

                modalInstance.result.then(function (orderId) {
                    $state.go('orders.detail', {orderId: orderId});
                }, function () {

                });
            };

            $scope.openLightboxModal = function (index) {
                Lightbox.openModal($scope.pictures, index);
            };

            $scope.getThumbnail = function (url) {
                return GeneralService.getThumbnail(url);
            };

            $scope.loadServiceMap = function () {
                $('#openMapModal').modal();

                $('#openMapModal').on('shown.bs.modal', function () {
                    // Check if the location is null
                    if (!$scope.service.location) {
                        return;
                    }

                    uiGmapGoogleMapApi.then(function (maps) {
                        var myLatLng = {lat: $scope.service.location.lat, lng: $scope.service.location.lon};

                        var map = new maps.Map(document.getElementById('service-map'), {
                            zoom: 15,
                            center: myLatLng
                        });

                        var marker = new maps.Marker({
                            position: myLatLng,
                            map: map,
                            title: $scope.service.name
                        });
                    });
                });
            };


            // Define buttons for Service Fragment
            $scope.serviceButtons                    = {
                firstButton : 'ORDER',
                secondButton: 'FAVORITE'
            };
            $scope.serviceButtons.firstButtonAction  = function (serviceId, shopId) {
                $scope.openOrderServiceModal(serviceId, shopId);
            };
            $scope.serviceButtons.secondButtonAction = function (serviceId) {
                $scope.toggleFavoriteService(serviceId);
            };


            $scope.openServicePage = function (serviceId) {
                $state.go('service', {'serviceId': serviceId});
            };

            $scope.trackShare = function (socialMedia) {
                if ($mixpanel) {
                    $mixpanel.track('SHARE', {
                        'Share Type'          : 'Service',
                        'Social Media'        : socialMedia,
                        'Sharer'              : $scope.isOwner ? 'Shop Owner' : 'User',
                        'Source'              : 'Service Page',
                        'Service Name'        : $scope.service.name,
                        'Service Category'    : $scope.service.categoryName,
                        'Service Sub-category': $scope.service.subCategoryNames[0],
                        'Goly Grade'          : $scope.service.golyGrade,
                        'Shop Name'           : $scope.shop.name,
                        'Rating'              : $scope.service.ratings,
                        'Starting Price'      : $scope.service.price,
                        'Provider Type'       : $scope.shop.providerType
                    });
                }
            };

            $scope.generateLink = function (obj, type) {
                return GeneralService.generateLink(obj, type);
            };
        });
}());
