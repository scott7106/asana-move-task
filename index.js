const core = require('@actions/core');
const github = require('@actions/github');
const Asana = require('asana');

async function asanaOperations(
  asanaPAT,
  targets,
  taskId
) {
  try {
    let client = Asana.ApiClient.instance;
    let token = client.authentications['token'];
    token.accessToken = asanaPAT;
    let tasksApiInstance = new Asana.TasksApi();
    let sectionsApiInstance = new Asana.SectionsApi();
    
    const task = await tasksApiInstance.getTask(taskId);
    if (!task) {
      core.error(`Asana task ${taskId} not found.`);
      return;
    }
    
    await Promise.all(targets.map(async target => {
      let targetProject = task.data.projects.find(project => project.name === target.project);
      if (!targetProject) {
        core.info(`Task '${taskId}' not found in Asana project ${target.project}.`);
        return;
      }
    
      let targetSection = await sectionsApiInstance.getSectionsForProject(targetProject.gid)
        .then(sections => sections.data.find(section => section.name === target.section));
      if (!targetSection) {
        core.error(`Asana section ${target.section} not found in Asana project ${target.project}.`);
        return;
      }
    
      await sectionsApiInstance.addTaskForSection(targetSection.gid, { body: { data: { task: taskId } } });
      core.info(`Moved to: ${target.project}/${target.section}`);
    }));
  } catch (ex) {
    console.error(ex.value);
  }
}

try {
  const ASANA_PAT = core.getInput('asana-pat'),
    TARGETS = core.getInput('targets'),
    PULL_REQUEST = github.context.payload.pull_request,
    REGEX = new RegExp(
        "https://app\\.asana\\.com/(?<urlVersion>\\d+)/(?<firstId>\\d+)(/project/)?(?<secondId>\\d+)(/task/)?(?<thirdId>\\d+)?.*?\\)",
        'g'
      );
  
  let targets = TARGETS? JSON.parse(TARGETS) : [],
    parseAsanaURL = null;

  if (!ASANA_PAT){
    throw({message: 'ASANA PAT Not Found!'});
  }
  
  if (!targets || targets.length === 0) { 
    throw({message: 'No targets found!'});
  }
  
  let matches = PULL_REQUEST.body.match(REGEX);
  if (!matches && matches.length === 0) {
      core.info(`No Asana task URL found in the pull request body.`);
      return;
  }

  while ((taskUrl = REGEX.exec(PULL_REQUEST.body)) !== null) {
    let { urlVersion, secondId, thirdId } = taskUrl.groups;
    let taskId = null;
    if (urlVersion) {
      taskId = urlVersion === "0" ? secondId : thirdId;
      if (taskId) {
        asanaOperations(ASANA_PAT, targets, taskId)
            .then(() => {
              core.info(`Asana task ${taskId} moved successfully.`);
            })
            .catch(e => {
              core.error(`Error moving Asana task ${taskId}: ${e.message}`);
            });
      } else {
        core.info(`Invalid Asana task URL: ${taskUrl}`);
      }
    }
  }
} catch (error) {
  core.error(error.message);
}
