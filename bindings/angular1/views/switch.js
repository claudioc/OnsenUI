/*
Copyright 2013-2015 ASIAL CORPORATION

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

(function(){
  'use strict';

  angular.module('onsen').factory('SwitchView', function($parse, $onsen) {

    var SwitchView = Class.extend({

      /**
       * @param {jqLite} element
       * @param {Object} scope
       * @param {Object} attrs
       */
      init: function(element, scope, attrs) {
        this._element = element;
        this._checkbox = angular.element(element[0].querySelector('input[type=checkbox]'));
        this._scope = scope;

        this._checkbox.on('change', function() {
          this.emit('change', {'switch': this, value: this._checkbox[0].checked, isInteractive: true});
        }.bind(this));

        this._prepareNgModel(element, scope, attrs);

        this._scope.$on('$destroy', this._destroy.bind(this));

        this._clearDerivingMethods = $onsen.deriveMethods(this, element[0], [
          'isChecked',
          'setChecked',
          'getCheckboxElement'
        ]);
      },

      _prepareNgModel: function(element, scope, attrs) {
        if (attrs.ngModel) {
          var set = $parse(attrs.ngModel).assign;

          scope.$parent.$watch(attrs.ngModel, function(value) {
            this.setChecked(!!value);
          }.bind(this));

          this._checkbox.on('change', function(e) {
            set(scope.$parent, this.isChecked());

            if (attrs.ngChange) {
              scope.$eval(attrs.ngChange);
            }

            scope.$parent.$evalAsync();
          }.bind(this));
        }
      },

      _destroy: function() {
        this.emit('destroy');
        this._clearDerivingMethods();
        this._element = this._checkbox = this._scope = null;
      }
    });
    MicroEvent.mixin(SwitchView);

    return SwitchView;
  });
})();
