function () {
	return {
		restrict: 'E',
		replace: true,
		scope: {
			icon: "@",
			fname: "@",
			ext: "@"
		},
		template: "<svg><use xlink:href='{{iconName}}'></use></svg>",
		link: function(scope){
			//File icon mapping
			var fileIcons = {
				xls: 'cm-icon-xls',
				xlsx: 'cm-icon-xls',
				doc: 'cm-icon-doc',
				docx: 'cm-icon-doc',
				pdf: 'cm-icon-pdf',
				jpg: 'cm-icon-jpg',
				jpeg: 'cm-icon-jpg',
				png: 'cm-icon-png',
				bmp: 'cm-icon-bmp',
				gif: 'cm-icon-gif',
				zip: 'cm-icon-zip',
				txt: 'cm-icon-txt',
				rtf: 'cm-icon-txt',
				ppt: 'cm-icon-ppt',
				pptx: 'cm-icon-ppt',
				err: 'cm-icon-err',
				def: 'cm-icon-doc'
			};
			scope.$watch('fname', function(){
				if(scope.fname){
					var ext = scope.fname.substr((~-scope.fname.lastIndexOf(".") >>> 0) + 2);
					if(ext)
						ext = ext.toLowerCase();
					scope.iconName = '#' + (fileIcons[ext] ? fileIcons[ext] : fileIcons.def);
				}
			});
			scope.$watch('ext', function(){
				if(scope.ext){
					scope.iconName = '#' + (fileIcons[scope.ext] ? fileIcons[scope.ext] : fileIcons.def);	
				}
			});
			scope.$watch('icon', function(){
				if(scope.icon){
					scope.iconName = '#' + scope.icon;
				}
			});
		}
	};
}