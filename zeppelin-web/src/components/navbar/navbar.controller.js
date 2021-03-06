/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('zeppelinWebApp')
.filter('notebookFilter', function() {
  return function (notebooks, searchText)
  {
    if (!searchText) {
      return notebooks;
    }

    var filteringNote = function(notebooks, filteredNotes) {
      _.each(notebooks, function(notebook) {

        if (notebook.name.toLowerCase().indexOf(searchText) !== -1) {
          filteredNotes.push(notebook);
          return notebook;
        }

        if (notebook.children) {
          filteringNote(notebook.children, filteredNotes);
        }
      });
    };

    return _.filter(notebooks, function(notebook) {
      if (notebook.children) {
        var filteredNotes = [];
        filteringNote(notebook.children, filteredNotes);

        if (filteredNotes.length > 0) {
          return filteredNotes;
        }
      }

      if (notebook.name.toLowerCase().indexOf(searchText) !== -1) {
        return notebook;
      }
    });
  };
})
.controller('NavCtrl', function($scope, $rootScope, $http, $routeParams,
    $location, notebookListDataFactory, baseUrlSrv, websocketMsgSrv, arrayOrderingSrv, searchService) {

  /** Current list of notes (ids) */

  $scope.showLoginWindow = function() {
    setTimeout(function() {
      angular.element('#userName').focus();
    }, 500);
  };

  var vm = this;
  vm.notes = notebookListDataFactory;
  vm.connected = websocketMsgSrv.isConnected();
  vm.websocketMsgSrv = websocketMsgSrv;
  vm.arrayOrderingSrv = arrayOrderingSrv;
  $scope.searchForm = searchService;

  angular.element('#notebook-list').perfectScrollbar({suppressScrollX: true});

  $scope.$on('setNoteMenu', function(event, notes) {
    notebookListDataFactory.setNotes(notes);
  });

  $scope.$on('setConnectedStatus', function(event, param) {
    vm.connected = param;
  });

  $scope.$on('loginSuccess', function(event, param) {
    loadNotes();
  });

  $scope.logout = function() {
    var logoutURL = baseUrlSrv.getRestApiBase() + '/login/logout';
    var request = new XMLHttpRequest();

    //force authcBasic (if configured) to logout by setting credentials as false:false
    request.open('post', logoutURL, true, 'false', 'false');
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 401 || request.status === 405) {
          $rootScope.userName = '';
          $rootScope.ticket.principal = '';
          $rootScope.ticket.ticket = '';
          $rootScope.ticket.roles = '';
          BootstrapDialog.show({
            message: 'Logout Success'
          });
          setTimeout(function() {
            window.location.replace('/');
          }, 1000);
        } else {
          request.open('post', logoutURL, true, 'false', 'false');
          request.send();
        }
      }
    };
    request.send();
  };

  $scope.search = function(searchTerm) {
    $location.url(/search/ + searchTerm);
  };

  function loadNotes() {
    websocketMsgSrv.getNotebookList();
  }

  function isActive(noteId) {
    return ($routeParams.noteId === noteId);
  }

  $rootScope.noteName = function(note) {
    if (!_.isEmpty(note)) {
      return arrayOrderingSrv.getNoteName(note);
    }
  };

  function getZeppelinVersion() {
    $http.get(baseUrlSrv.getRestApiBase() + '/version').success(
      function(data, status, headers, config) {
        $rootScope.zeppelinVersion = data.body;
      }).error(
      function(data, status, headers, config) {
        console.log('Error %o %o', status, data.message);
      });
  }

  vm.loadNotes = loadNotes;
  vm.isActive = isActive;

  getZeppelinVersion();
  vm.loadNotes();

});
