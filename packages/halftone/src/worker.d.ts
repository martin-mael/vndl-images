declare module "*.worker?worker&inline" {
	const WorkerConstructor: { new (): Worker };
	export default WorkerConstructor;
}
