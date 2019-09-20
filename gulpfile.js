var gulp = require('gulp')
var requireIndex = require('gulp-require-index')

gulp.task('buildIndex', function () {
  return gulp.src('./src/**/*.js')
    .pipe(requireIndex())
    .pipe(gulp.dest('./'))
})
