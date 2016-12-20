(function () {
    'use strict';
    angular.module('search.controller', [
            'ui.router'
        ])
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider.state(
                'search', {
                    url: '/search?text&minPrice&maxPrice&currentLatitude&currentLongitude&subCategoryIds&searchType&city&country&eventType&page',
                    templateUrl: 'modules/search/search.html',
                    controller: 'SearchController'
                });
        }])
        .controller('SearchController', function ($rootScope, $scope, $state, $uibModal, filterFilter, Notification,
                                                  UserService, ServiceService, GeneralService, ShopService, CONFIG, $mixpanel) {
            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////
            if ($state.current.name == 'search') {
                $rootScope.pageTitle = 'Find & book nearby event services';
                $rootScope.pageDescription = 'Find the nearest, most affordable and high-quality service for your event. Organize your event easily in one place.';
            }

            $scope.filterIsShowing = false;
            $scope.toggleFilter = function () {
                $scope.filterIsShowing = !$scope.filterIsShowing;
            };

            // Get all state params
            var searchTextParam = $state.params.text;
            var minPriceParam = $state.params.minPrice;
            var maxPriceParam = $state.params.maxPrice;
            var curLatParam = $state.params.currentLatitude;
            var curLngParam = $state.params.currentLongitude;
            var subCategoryIdsParam = $state.params.subCategoryIds;
            var searchType = $state.params.searchType;
            var cityParam = $state.params.city;
            var countryParam = $state.params.country;
            var eventType = $state.params.eventType;
            var currentPage = $state.params.page;

            // Get token
            var token = $rootScope.userSession;

            // initial search mode
            if (searchType && searchType == 'provider') {
                $scope.searchMode = {
                    'service': false,
                    'provider': true
                };
            } else {
                $scope.searchMode = {
                    'service': true,
                    'provider': false
                };
            }
            $scope.currentPage = currentPage === undefined ? 1 : currentPage;
            $scope.totalRecord = null;
            $scope.services = [];
            $scope.providers = [];

            //initial scope data
            if (maxPriceParam) {
                $scope.maxPrice = parseInt(maxPriceParam);
            }
            if (minPriceParam) {
                $scope.minPrice = parseInt(minPriceParam);
            }
            if (searchTextParam) {
                $scope.searchText = searchTextParam;
            }
            if (cityParam) {
                $scope.city = cityParam;
            }

            if (countryParam) {
                $scope.country = countryParam;
            } else {
                // Get country from IP/User's country
                $scope.country = $rootScope.country;
            }

            $scope.locationOptions = {
                country: $scope.country
            };

            if (eventType) {
                $scope.eventType = eventType;
            }
            $scope.initialised = false;

            // Load data if the current state is "search"
            if ($state.current.name === 'search') {
                // Load all Event Type to dropdown
                GeneralService.listAllTags($scope.country, function (response) {
                    if (response.status == 'OK') {
                        $scope.eventTypeTags = response.tags;
                    } else {
                        Notification.error({
                            message: response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });

                // Load Categories and Sub-Categories
                GeneralService.listCategory(function (response) {
                    if (response.status == 'OK') {
                        $scope.categories = response.categories;
                        $scope.selectedSubCategories = [];
                        $scope.selectedCategory = null;

                        //// Load default checked Sub-Categories
                        if (subCategoryIdsParam && subCategoryIdsParam !== null) {
                            // Push SubCategory to array
                            if (subCategoryIdsParam.constructor === Array) {
                                for (var i = 0; i < subCategoryIdsParam.length; i++) {
                                    $scope.selectedSubCategories.push(subCategoryIdsParam[i]);
                                }
                            } else {
                                $scope.selectedSubCategories.push(subCategoryIdsParam);
                            }

                            // Find selected category
                            findCategory:
                                for (var k = 0; k < $scope.categories.length; k++) {
                                    for (var j = 0; j < $scope.categories[k].listSubCategory.length; j++) {
                                        if ($scope.selectedSubCategories.indexOf($scope.categories[k].listSubCategory[j].id) != -1) {
                                            $scope.selectedCategory = $scope.categories[k];
                                            break findCategory;
                                        }

                                    }
                                }
                        }

                    } else {
                        Notification.error({
                            message: response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });

                // Turn on initialised flag
                $scope.initialised = false;
            }

            ////////////////////////////////////////////////
            /////////////////// METHOD ///////////////////
            ////////////////////////////////////////////////
            $scope.startSearch = function () {
                // Exit if country is undefined
                if ($scope.country === undefined) {
                    return null;
                }

                var fromRecord = $scope.currentPage - 1;

                // Load search result
                if ($scope.searchMode.service === true) {
                    ServiceService.searchServices(
                        searchTextParam, // search text
                        minPriceParam, // min price
                        maxPriceParam, // max price
                        curLatParam, // current latitude
                        curLngParam, // current longitude
                        subCategoryIdsParam, // list of sub-category Ids
                        cityParam,
                        $scope.country,
                        [eventType],
                        fromRecord * 50, // for pagination
                        function (response) {
                            if (response.status == 'OK') {
                                $scope.services = response.services;
                                $scope.initialised = true;
                                $scope.totalRecord = response.totalRecord;

                                // Set the flag so that Prerender knows that it is ready
                                window.prerenderReady = true;
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
                    var searchObj = {
                        text: searchTextParam,
                        city: cityParam,
                        country: $scope.country,
                        from: fromRecord * 50
                    };
                    ShopService.searchProviders(
                        searchObj,
                        function (response) {
                            if (response.status == 'OK') {
                                $scope.providers = response.providers;
                                $scope.initialised = true;
                                $scope.totalRecord = response.totalRecord;

                                // Set the flag so that Prerender knows that it is ready
                                window.prerenderReady = true;
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

            $scope.changePage = function () {
               // Check if initialized, if not then reassign currentPage
               if (!$scope.initialised) {
                   $scope.currentPage = currentPage === undefined ? 1 : currentPage;
                   return;
               }

               var newParams = $state.params;
               newParams.page = $scope.currentPage;
               $state.go('.', newParams);
               $scope.initialised = false;
               $scope.startSearch();
           };

            $scope.getCityName = function () {
                if ($scope.city === undefined) {
                    return null;
                }

                var str = $scope.city.split(',');
                return str[0];
            };

            $scope.isSelectedSubCategory = function (subCategoryId) {
                return ($scope.selectedSubCategories.indexOf(subCategoryId) != -1);
            };

            $scope.isSelectedCategory = function (categoryId) {
                if (!$scope.selectedCategory) {
                    return false;
                }
                return $scope.selectedCategory.category.id == categoryId;
            };

            $scope.isFavoriteService = function (serviceId) {
                if (token && token.currentUser) {
                    return token.currentUser.favoriteServiceIds.indexOf(serviceId) != -1;
                }
                return null;
            };

            $scope.isFavoriteProvider = function (providerId) {
                if (token && token.currentUser) {
                    return token.currentUser.favoriteProviderIds.indexOf(providerId) != -1;
                }
                return null;
            };

            // Search result with text via header search bar, or via explore page
            $scope.search = function (source, text, subCategoryId, eventType) {
                if ($mixpanel) {
                    $mixpanel.track('SEARCH', {
                        'Source': source,
                        'Search Terms': text,
                        'Event Type': !eventType ? null : eventType,
                        'Sub-category': GeneralService.getCategoryName(subCategoryId),
                        'Location': $scope.country
                    });
                }

                $state.go('search', {
                    'text': text,
                    'minPrice': null,
                    'maxPrice': null,
                    'subCategoryIds': subCategoryId === undefined || subCategoryId === '' ? null : [subCategoryId],
                    'country': $scope.country,
                    'eventType': !eventType ? null : eventType
                });
            };

            $scope.switchMode = function (mode) {
                searchType = mode;
                $scope.filterSearch();
            };

            // Search result with filter criteria via left panel
            $scope.filterSearch = function (subCategoryId) {
                if (searchType === undefined || searchType == 'service') {
                    if (subCategoryId !== undefined) {
                        if ($scope.selectedSubCategories.indexOf(subCategoryId) != -1) {
                            // Remove filter by sub category
                            $scope.selectedSubCategories = [];
                        } else {
                            $scope.selectedSubCategories = [subCategoryId];
                        }
                    }

                    if ($mixpanel) {
                        $mixpanel.track('SEARCH', {
                            'Source': 'Search',
                            'Search Terms': $scope.searchText,
                            'Min Price': $scope.minPrice,
                            'Max Price': $scope.maxPrice,
                            'Event Type': !$scope.eventType ? null : $scope.eventType,
                            'Sub-category': GeneralService.getCategoryName($scope.selectedSubCategories[0]),
                            'Location': $scope.getCityName() + $scope.country
                        });
                    }

                    $state.go('search', {
                        'text': $scope.searchText,
                        'minPrice': $scope.minPrice,
                        'maxPrice': $scope.maxPrice,
                        'subCategoryIds': $scope.selectedSubCategories,
                        'city': $scope.getCityName(),
                        'country': $scope.country,
                        'eventType': !$scope.eventType ? null : $scope.eventType,
                        'searchType': 'service'
                    });
                } else if (searchType == 'provider') {
                    $mixpanel.track('SEARCH PROVIDER', {
                        'Source': 'Search',
                        'Search Terms': $scope.searchText,
                    });

                    $state.go('search', {
                        'text': $scope.searchText,
                        'country': $scope.country,
                        'searchType': 'provider'
                    });
                }
            };

            $scope.addToFavoriteService = function (serviceId) {
                if (!token.currentUser) {
                    Notification.error({
                        message: 'Cannot identify user. Please login first!',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
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
            };

            // helper method to get selected category
            $scope.selectCategory = function (category) {
                $scope.selectedCategory = category;
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
                });
            };

            $scope.timeAgoCreation = function (time) {
                return moment(time).fromNow();
            };

            // Define buttons for Service Fragment
            $scope.serviceButtons = {
                firstButton: 'ORDER',
                secondButton: 'FAVORITE'
            };
            $scope.serviceButtons.firstButtonAction = function (serviceId, shopId) {
                $scope.openOrderServiceModal(serviceId, shopId);
            };
            $scope.serviceButtons.secondButtonAction = function (serviceId) {
                $scope.addToFavoriteService(serviceId);
            };

            // Load search result
            if ($state.current.name === 'search') {
                $scope.startSearch();
            }
        });
}());
