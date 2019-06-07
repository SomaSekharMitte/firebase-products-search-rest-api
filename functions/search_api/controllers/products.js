/**
 * Products Controller for performing all Products related transactions 
 */
const Product = require('../model/product');

exports.products_get_by_filter_conditions = (request, response, next) => {

    var pageNumber = request.params.pageNumber;
    var pageSize = request.params.pageSize;
    var query = {};

    if (pageNumber < 0 || pageNumber == 0) {
        const error = new Error('Invalid page number, should start with 1');
        error.status = 400;
        error.validUrl = 'https://mobile-tha-server-8ba57.firebaseapp.com/walmartproducts/{pageNumber}/{pageSize}';
        next(error);
    }

    if (!(pageSize >= 1 && pageSize <= 30)) {
        const error = new Error('Invalid page Size, should be between 1 and 30');
        error.status = 400;
        error.validUrl = 'https://mobile-tha-server-8ba57.firebaseapp.com/walmartproducts/{pageNumber}/{pageSize}';
        next(error);
    }

    // Parse and map all the query parameters to queryParams map
    const queryParams = Object.assign({}, ...Object.keys(request.query).map(objKey => {
        return {
            [objKey]: request.query[objKey]
        }
    }));

    var filters = {};

    // Set skip and limit for server side pagination
    query.skip = pageSize * (pageNumber - 1);
    query.limit = parseInt(pageSize);

    // Perform the query string validation and amend the filters for the final search criteria
    if (queryParams.search != undefined && queryParams.search.length != null) {
        filters = {
            'productName': {
                '$regex': queryParams.search,
                '$options': 'i'
            }
        }
    }
    if (queryParams.inStock != undefined) {
        filters = Object.assign(filters, {
            'inStock': queryParams.inStock
        });
    }
    // ReviewCount filtering
    if (queryParams.minReviewCount > 0 && queryParams.maxReviewCount == undefined) {
        filters = Object.assign(filters, {
            'reviewCount': {
                '$gte': queryParams.minReviewCount
            }
        });
    } else if (queryParams.maxReviewCount > 0 && queryParams.minReviewCount == undefined) {
        filters = Object.assign(filters, {
            'reviewCount': {
                '$lte': queryParams.maxReviewCount
            }
        });
    } else if (queryParams.maxReviewCount > 0 && queryParams.minReviewCount > 0) {
        filters = Object.assign(filters, {
            'reviewCount': {
                '$gte': queryParams.minReviewCount,
                '$lte': queryParams.maxReviewCount
            }
        });
    }
    // ReviewRating filtering
    if (queryParams.minReviewRating > 0 && queryParams.maxReviewRating == undefined) {
        filters = Object.assign(filters, {
            'reviewRating': {
                '$gte': queryParams.minReviewRating
            }
        });
    } else if (queryParams.maxReviewRating > 0 && queryParams.minReviewRating == undefined) {
        filters = Object.assign(filters, {
            'reviewRating': {
                '$lte': queryParams.maxReviewRating
            }
        });
    } else if (queryParams.maxReviewRating > 0 && queryParams.minReviewRating > 0) {
        filters = Object.assign(filters, {
            'reviewRating': {
                '$gte': queryParams.minReviewRating,
                '$lte': queryParams.maxReviewRating
            }
        });
    }
    // Price filtering
    if (queryParams.minPrice > 0 && queryParams.maxPrice == undefined) {
        filters = Object.assign(filters, {
            'price': {
                '$gte': queryParams.minPrice
            }
        });
    } else if (queryParams.maxPrice > 0 && queryParams.minPrice == undefined) {
        filters = Object.assign(filters, {
            'price': {
                '$lte': queryParams.maxPrice
            }
        });
    } else if (queryParams.maxPrice > 0 && queryParams.minPrice > 0) {
        filters = Object.assign(filters, {
            'price': {
                '$gte': queryParams.minPrice,
                '$lte': queryParams.maxPrice
            }
        });
    }

    var totalProducts;

    Product.countDocuments().then((error, count) => {
        if (error) {
            totalProducts = JSON.stringify(error);
            console.log('Error occurred at records count fetch: ' + totalProducts);
        } else {
            totalProducts = JSON.stringify(count);
        }
    });

    // Make a call to get all the products matching the criteria
    Product.find(filters, {}, query)
        .select()
        .exec()
        .then(productDocs => {
            // Customize the response to be shown up in the JSON response
            const docResponse = productDocs.map(doc => {
                const priceVal = doc.price.toFixed(2);
                return {
                    productId: doc.productId,
                    productName: doc.productName,
                    shortDescription: doc.shortDescription,
                    longDescription: doc.longDescription,
                    price: String("$").concat(priceVal),
                    productImage: doc.productImage,
                    reviewRating: doc.reviewRating,
                    reviewCount: doc.reviewCount,
                    inStock: doc.inStock
                }
            });
            response.status(200).json({
                products: docResponse,
                totalProducts: parseInt(totalProducts),
                pageNumber: Number(request.params.pageNumber),
                pageSize: Number(request.params.pageSize),
                statusCode: 200
            });
        }).catch(err => {
            const error = new Error(err);
            error.status = 500;
            error.validUrl = 'https://mobile-tha-server-8ba57.firebaseapp.com/walmartproducts/{pageNumber}/{pageSize}';
            next(error);
        });

    async function totalRecordsCount(Product) {
        var totalProducts;
        await Product.find({}).then(docs => {
            Product.countDocuments({}).then(number => {
                totalProducts = JSON.stringify(number);
            });
        })

        return totalProducts;
    }
}