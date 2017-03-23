import gulp from 'gulp';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import cssnano from 'gulp-cssnano';
import autoprefixer from 'gulp-autoprefixer';
import svgSprite from 'gulp-svg-sprite';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';
import gulpIf from 'gulp-if';
import rev from 'gulp-rev';
import revReplace from 'gulp-rev-replace';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import del from 'del';
import browserSync from 'browser-sync';
import nodemon from 'gulp-nodemon';
import combineS from 'stream-combiner2';

const bs = browserSync.create();
const combine = combineS.obj;

const isDevelopment = process.env.NODE_ENV !== 'production';
const devTool = isDevelopment ? 'source-map' : false;

const deleteFolders = ['public', 'tmp', 'manifest', 'src/svg/sprite.svg'];

const plumberMessage = (title) => {
  return {
    errorHandler: notify.onError((err) => ({
      title: title,
      message: err.message
    }))
  };
};

const clean = () => {
  return del(deleteFolders);
};

const compileJS = () => {
  return gulp.src('src/js/index.js')
    .pipe(plumber(plumberMessage('compileJS')))
    .pipe(webpack({
      output: {
        filename: 'common.js',
      },
      devtool: devTool,
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: ['node_modules'],
            loader: 'babel-loader'
          }
        ]
    }}))
    .pipe(gulpIf(!isDevelopment, combine(uglify(), rev())))
    .pipe(gulp.dest('public/js/'))
    .pipe(gulpIf(!isDevelopment, combine(rev.manifest('js.json'), gulp.dest('manifest'))));
};

const compileStyles = () => {
  return gulp.src('src/styles/common.scss')
    .pipe(plumber(plumberMessage('compileStyles')))
    .pipe(gulpIf(isDevelopment, sourcemaps.init()))
    .pipe(sass({
			includePaths: [
        'tmp/styles',
				'node_modules/normalize-scss/sass'
      ]
		}))
    .pipe(gulpIf(isDevelopment, sourcemaps.write()))
    .pipe(gulpIf(!isDevelopment, combine(
      autoprefixer({browsers: ['last 2 versions']}),
      revReplace({
        manifest: gulp.src('manifest/svg.json', {allowEmpty: true})
      }),
      cssnano(),
      rev()
    )))
    .pipe(gulp.dest('public/styles'))
    .pipe(gulpIf(!isDevelopment, combine(rev.manifest('css.json'), gulp.dest('manifest'))));
};

const createSVGSprite = () => {
  return gulp.src('src/styles/**/*.svg')
    .pipe(plumber(plumberMessage('createSVGSprite')))
    .pipe(svgSprite({
      mode: {
        stack: {
          dest: ".",
          sprite: "sprite.svg",
          layout:     'vertical'
        }
      }
    }))
    .pipe(gulp.dest('src/svg'));
};

const copyImages = () => {
  return gulp.src('src/styles/**/*.{png,jpg}', {since: gulp.lastRun(copyImages)})
  .pipe(plumber(plumberMessage('copyImages')))
  .pipe(gulpIf(!isDevelopment, rev()))
  .pipe(gulp.dest('public/img/'))
  .pipe(gulpIf(!isDevelopment, combine(rev.manifest('assets.json'), gulp.dest('manifest'))));
};

const copySVGs = () => {
  return gulp.src('src/svg/**/*.svg', {since: gulp.lastRun(copySVGs)})
  .pipe(plumber(plumberMessage('copySVGs')))
  .pipe(gulpIf(!isDevelopment, rev()))
  .pipe(gulp.dest('public/styles'))
  .pipe(gulpIf(!isDevelopment, combine(rev.manifest('svg.json'), gulp.dest('manifest'))));
};

const copyAssets = () => {
  return gulp.src('src/assets/**/*.*', {since: gulp.lastRun(copyAssets)})
    .pipe(gulpIf(!isDevelopment, revReplace({
      manifest: gulp.src('manifest/css.json', {allowEmpty: true})
    })))
    .pipe(gulpIf(!isDevelopment, revReplace({
      manifest: gulp.src('manifest/js.json', {allowEmpty: true})
    })))
    .pipe(gulpIf(!isDevelopment, revReplace({
      manifest: gulp.src('manifest/svg.json', {allowEmpty: true})
    })))
    .pipe(gulp.dest('public'));
};

const watch = (done) => {
  gulp.watch(['src/styles/**/*.scss', 'tmp/styles/sprite.scss'], gulp.series(compileStyles));
  gulp.watch('src/js/**/*.js', gulp.series(compileJS));
  gulp.watch('src/styles/**/*.svg', gulp.series(createSVGSprite));
  gulp.watch('src/svg/**/*.svg', gulp.series(copySVGs));
  gulp.watch('src/assets/**/*.*', gulp.series(copyAssets));
  done();
};

const syncBrowser = (done) => {
  bs.init(null, {
    server: {
        baseDir: "./public"
    },
    browser: "google chrome"
  });
  bs.watch('public/**/*.*').on('change', bs.reload);
  done();
};

const buildQueue = [
  clean,
  compileJS,
  compileStyles,
  // createSVGSprite,
  copyImages,
  copySVGs,
  copyAssets
];

gulp.task('build', gulp.series(...buildQueue));
gulp.task('dev', gulp.series('build', gulp.parallel(watch, syncBrowser)));
