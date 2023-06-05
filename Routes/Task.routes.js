const express = require("express");
const { TaskModel } = require("../Model/Task.model");

const taskRoutes = express.Router();
  

taskRoutes.get("/projects", async (req, res) => {
  try {
    const { page = 1, search = "", sort = "" } = req.query;

    const pipeline = [];

    if (search) {
      const searchStage = {
        $match: {
          $or: [
            { title: { $regex: new RegExp(search, "i") } },
            { reason: { $regex: new RegExp(search, "i") } },
            { type: { $regex: new RegExp(search, "i") } },
            { divison: { $regex: new RegExp(search, "i") } },
            { category: { $regex: new RegExp(search, "i") } },
            { priority: { $regex: new RegExp(search, "i") } },
            { department: { $regex: new RegExp(search, "i") } },
            { location: { $regex: new RegExp(search, "i") } },
            { status: { $regex: new RegExp(search, "i") } },
            
//             { status: { $regex: search, $options: "i" } },
          ],
        },
      };
      pipeline.push(searchStage);
    }

//     if (sort) {
//       const sortStage = {
//         $sort: { [sort]: 1 },
//       };
//       pipeline.push(sortStage);
//     }
    
        if (sort) {
      let sortStage;

      if (sort === "_id") {
        sortStage = {
          $sort: { _id: -1 },
        };
      } else {
        sortStage = {
          $sort: { [sort]: 1 },
        };
      }

      pipeline.push(sortStage);
    }

    const totalCountPipeline = [...pipeline]; // Create a separate pipeline for total count
    totalCountPipeline.push({ $count: "totalCount" }); // Add $count stage to count the total documents

    pipeline.push(
      { $skip: (page - 1) * 10 },
      { $limit: 10 }
    );

    const [projects, totalCount] = await Promise.all([
      TaskModel.aggregate(pipeline),
      TaskModel.aggregate(totalCountPipeline)
    ]);

    res.status(200).send({ projects, totalCount: totalCount[0]?.totalCount || 0 });

  } 
  
  catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal Server Error" });
  }
});




taskRoutes.post("/add/project", async(req,res) => {

    const payload = req.body;

    try {
        const task = new TaskModel(payload);
        await task.save();

        res.status(201).send({"message": "Task created successfully"});
    } 
    
    catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
})

taskRoutes.patch("/project/:id", async(req,res) => {

    const {id} = req.params;
    const {status} = req.body;
    console.log("status", status)

    try {
        const newTask = await TaskModel.findByIdAndUpdate(id,{status}, {new: true});

        if(!newTask){
            return res.status(404).send({"message": 'Project not found' });
        }

        res.status(200).send({"message":"Status updated successfully", "updatedTask": newTask});
    } 
    
    catch (err) {
        console.log(err);
        res.status(500).send("Internal Server Error");
    }
})


module.exports = { taskRoutes };
