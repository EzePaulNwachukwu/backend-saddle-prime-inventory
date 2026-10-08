// Wraps a Mongoose query with chainable filter/sort/field-limit/pagination
// helpers driven by the request's query string, e.g. ?category=Hardware&sort=price&page=2
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Allow gte/gt/lte/lt/regex in the query string, e.g. ?price[gte]=1000 or ?name[regex]=phone
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|regex)\b/g, (match) => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);

    // A $regex filter is always case-insensitive partial matching (a text search box, not exact match)
    Object.values(parsedQuery).forEach((condition) => {
      if (condition && typeof condition === 'object' && condition.$regex) {
        condition.$options = 'i';
      }
    });

    this.query = this.query.find(parsedQuery);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  // Counts how many documents match the filter, ignoring pagination — used to build page controls
  count() {
    return this.query.model.countDocuments(this.query.getFilter());
  }

  // Call after count() resolves, to get { page, limit, totalCount, totalPages } for the response
  getPaginationMeta(totalCount) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;

    return {
      page,
      limit,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1),
    };
  }
}

module.exports = APIFeatures;
