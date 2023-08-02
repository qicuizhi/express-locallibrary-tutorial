// 导入 express-validator 验证器
const { body, validationResult } = require("express-validator");
// 相当于
// const validator = require("express-validator");
// const body = validator.body;
// const validationResult = validator.validationResult;

// 导入异步相关工具
const asyncHandler = require("express-async-handler");
// 此页面应该利用_id 字段值 (自动生成) 呈现特定种类实例名称，各个种类的所有书本列表 (每本书都连结到书本的细节页面)。
const Genre = require("../models/genre");
const Book = require("../models/book");



// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "Genre List",
    genre_list: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  // not exist will return successfully with no results.
  // so we create an Error object and pass it to the next middleware function in the chain.
  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });


});

// Display Genre create form on GET.
// We don't need the asyncHandler() for this route, because it doesn't contain any code that can throw an exception.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};


// Handle Genre create on POST.
// 在我们所有的 POST控制器中，都使用了相同的模式：我们运行验证器，然后运行消毒器，然后检查错误，并使用错误信息重新呈现表单，或保存数据。
exports.genre_create_post = [

  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    // 用于删除任何尾随/前导空格
    .trim()
    // 检查名称字段是否不为空
    .isLength({ min: 3 })
    // 用于删除任何危险的 HTML 字符
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: req.body.name })
        // 我们执行不区分大小写的搜索以查看是否已经存在具有相同名称的
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // New genre saved. Redirect to genre detail page.
        res.redirect(genre.url);
      }
    }
  }),
];


// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books (in parallel)
  const [genre,booksInGenre]=await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({genre:req.params.id},"title summary").exec(),
  ]);

  if (genre === null) {
    // No results.
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete",{
    title:"Delete Genre",
    genre:genre,
    genre_books:booksInGenre
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
    // Get details of genre and all associated books (in parallel)
  const [genre,booksInGenre]=await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({genre:req.params.id},"title summary").exec(),
  ]);
  if(booksInGenre.length>0){
    // Genre has books. Render in same way as for GET route.
    res.render("genre_delete",{
      title:"Delete Genre",
      genre:genre,
      genre_books:booksInGenre
    });
    return;
  }else{
    // Genre has no books. Delete object and redirect to the list of genres.
    await Genre.findByIdAndRemove(req.body.genreid);
    res.redirect("/catalog/genres");
  }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre=await Genre.findById(req.params.id).exec();
  if(genre === null){
    const err=new Error("Genre not found");
    err.status=404;
    return next(err);
  }
  res.render("genre_form",{
    title:"Update Genre",
    genre:genre
  });
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();

  if (genre === null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_form", { title: "Update Genre", genre: genre });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request .
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data (and the old id!)
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values and error messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      await Genre.findByIdAndUpdate(req.params.id, genre);
      res.redirect(genre.url);
    }
  }),
];
