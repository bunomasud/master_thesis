db.getCollection('versions').aggregate(
                                        [
                                            {
                                                $match: {

                                                    "funcExpressionHashSet": {$exists: true},
													//"callExpressionHashSet" :{$exists: true},
                                                    "funcDeclarationHashSet": {$exists: true},
													"funcExpressionHashSetLength":502,//{$gt: 492, $lt: 512},
													"funcDeclarationHashSetLength":69,//{$gt: 59, $lt: 79},
													//"callExpressionHashSetLength":448 //{$gt: 1438, $lt: 1458}
													
                                                }
                                            },
                                            
                                            {
                                                $project: {
                                                    url: 1, filename: 1, funcExpressionHashSetLength: 1
                                                }
                                            
                                            }])